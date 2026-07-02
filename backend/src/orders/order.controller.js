const mongoose = require("mongoose");
const Order = require("./order.model");
const Book = require("../books/book.model");
const { triggerRecommendationRebuild } = require("../recommendations/recommendation.update");

const createAOrder = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid userId is required" });
    }

    const orderPayload = {
      ...req.body,
      userId: new mongoose.Types.ObjectId(userId)
    };

    const newOrder = new Order(orderPayload);
    const savedOrder = await newOrder.save();
    await savedOrder.populate('products.productId', 'title');
    
    setImmediate(() => triggerRecommendationRebuild("order-created"));
    
    res.status(200).json(savedOrder);
  } catch (error) {
    console.error("Error creating order", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

const getOrderByEmail = async (req, res) => {
  try {
    const {email} = req.params;
    const orders = await Order.find({email}).populate('products.productId', 'title coverImage').sort({createdAt: -1});
    if(!orders) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
}

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('products.productId', 'title coverImage').sort({createdAt: -1});
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching all orders", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    const order = await Order.findById(id);
    if(!order) return res.status(404).json({ message: 'Order not found' });
    
    const wasCompleted = order.completed;
    const isNowCompleted = Boolean(completed);
    
    if (!wasCompleted && isNowCompleted && order.products && order.products.length > 0) {
      for (const product of order.products) {
        const book = await Book.findById(product.productId);
        if (book) {
          book.stock = Math.max(0, Math.floor(book.stock - product.quantity));
          book.soldQuantity = Math.floor((book.soldQuantity || 0) + product.quantity);
          await book.save();
        }
      }
    }
    
    if (wasCompleted && !isNowCompleted && order.products && order.products.length > 0) {
      for (const product of order.products) {
        const book = await Book.findById(product.productId);
        if (book) {
          book.stock = Math.floor((book.stock || 0) + product.quantity);
          book.soldQuantity = Math.max(0, Math.floor((book.soldQuantity || 0) - product.quantity));
          await book.save();
        }
      }
    }
    
    order.completed = isNowCompleted;
    const updated = await order.save();
    await updated.populate('products.productId', 'title');
    
    if (isNowCompleted) {
        setImmediate(() => triggerRecommendationRebuild("order-completed"));
    }
    
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating order status", error);
    res.status(500).json({ message: "Failed to update order" });
  }
}

const confirmOrderReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Customer email is required to confirm receipt" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.email !== email) {
      return res.status(403).json({ message: "You are not allowed to confirm this order" });
    }

    if (order.buyerConfirmed) {
      return res.status(400).json({ message: "Order already confirmed" });
    }

    const wasCompleted = order.completed;

    if (!wasCompleted && order.products && order.products.length > 0) {
      for (const product of order.products) {
        const book = await Book.findById(product.productId);
        if (book) {
          book.stock = Math.max(0, Math.floor(book.stock - product.quantity));
          book.soldQuantity = Math.floor((book.soldQuantity || 0) + product.quantity);
          await book.save();
        }
      }
      order.completed = true;
    }

    order.buyerConfirmed = true;
    const updated = await order.save();
    await updated.populate('products.productId', 'title coverImage');

    // trigger recommendation rebuild when order is completed via buyer confirmation
    if (!wasCompleted && updated.completed) {
      setImmediate(() => triggerRecommendationRebuild("order-completed"));
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error confirming order receipt", error);
    return res.status(500).json({ message: "Failed to confirm order receipt" });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Order.findByIdAndDelete(id);
    if(!deleted) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error("Error deleting order", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
}

module.exports = {
  createAOrder,
  getOrderByEmail,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  confirmOrderReceipt
};

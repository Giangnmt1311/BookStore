const { GoogleGenAI } = require('@google/genai');
const Book = require('../books/book.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');

function getGeminiClient() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured on the server.'), { status: 500 });
  }
  return new GoogleGenAI({ apiKey });
}

async function retrieveRelevantBooks(query) {
  if (!query || typeof query !== 'string') return [];
  
  const isNewestQuery = /\b(newest|latest|recent|new|just added|recently added)\b/i.test(query);
  
  const sortOrder = isNewestQuery 
    ? { createdAt: -1 }
    : { featured: -1, createdAt: -1 };
  
  if (isNewestQuery && /\b(book|books)\b/i.test(query)) {
    const books = await Book.find({})
      .populate('authorId', 'name')
      .populate('genreId', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    
    return (books || []).map(book => {
      const bookObj = { ...book };
      if (bookObj.authorId) {
        bookObj.author = bookObj.authorId.name || 'Unknown';
      } else {
        bookObj.author = bookObj.author || 'Unknown';
      }
      if (bookObj.genreId) {
        bookObj.genres = bookObj.genreId.name || bookObj.genres || 'Unknown';
      }
      return bookObj;
    });
  }
  
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  let books = await Book.find({
    $or: [
      { title: regex },
      { description: regex },
      { genres: regex },
    ],
  })
    .populate('authorId', 'name')
    .populate('genreId', 'name')
    .sort(sortOrder)
    .limit(8)
    .lean();

  if (books.length === 0) {
    const authorBooks = await Book.find({})
      .populate('authorId', 'name')
      .populate('genreId', 'name')
      .sort(sortOrder)
      .limit(8)
      .lean();
    
    books = authorBooks.filter(book => {
      const authorName = book.authorId?.name || '';
      return authorName.toLowerCase().includes(query.toLowerCase());
    });
  }

  if (books.length === 0) {
    books = await Book.find({})
      .populate('authorId', 'name')
      .populate('genreId', 'name')
      .sort(sortOrder)
      .limit(8)
      .lean();
  }

  return (books || []).map(book => {
    const bookObj = { ...book };
    if (bookObj.authorId) {
      bookObj.author = bookObj.authorId.name || 'Unknown';
    } else {
      bookObj.author = bookObj.author || 'Unknown';
    }
    if (bookObj.genreId) {
      bookObj.genres = bookObj.genreId.name || bookObj.genres || 'Unknown';
    }
    return bookObj;
  });
}

function formatBooksForContext(books, includeAdminInfo = false, includeDate = false) {
  if (!Array.isArray(books) || books.length === 0) return 'No catalog context found.';
  const lines = books.map((b, idx) => {
    const authorName = b.author || (b.authorId?.name) || 'Unknown';
    const genreName = b.genres || (b.genreId?.name) || 'Unknown';
    const baseInfo = [
      `#${idx + 1}: ${b.title} by ${authorName}`,
      genreName ? `Genre: ${genreName}` : null,
      b.newPrice != null ? `Price: $${Number(b.newPrice).toFixed(2)}${b.oldPrice ? ` (was $${Number(b.oldPrice).toFixed(2)})` : ''}` : null,
    ];
    
    if (includeDate && b.createdAt) {
      const date = new Date(b.createdAt);
      baseInfo.push(`Added: ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    
    if (includeAdminInfo) {
      baseInfo.push(
        b.stock != null ? `Stock: ${b.stock}` : null,
        b.soldQuantity != null ? `Sold: ${b.soldQuantity}` : null
      );
    }
    
    baseInfo.push(
      b.description ? `Desc: ${String(b.description).slice(0, 280)}${String(b.description).length > 280 ? '…' : ''}` : null
    );
    
    return baseInfo
      .filter(Boolean)
      .join('\n');
  });
  return lines.join('\n\n');
}

const USER_SYSTEM_PROMPT = `You are an assistant for an online bookstore. 
Use the provided catalog context to answer questions about books, authors, genres, prices, and recommendations.
If the answer isn't in the context, say you don't know and provide a reasonable suggestion.
Be concise and helpful. Prefer titles we have in stock.
When mentioning specific books from the catalog, always use double quotes around book titles.
Do not use asterisks (**) or any markdown formatting. Use plain text only.
The books mentioned will be linked automatically below your response.`;

const ADMIN_SYSTEM_PROMPT = `You are an administrative assistant for an online bookstore management system.
Your role is to help the admin with store management tasks including:
- Managing books, authors, genres, and banners
- Understanding order statuses and customer information
- Providing insights about inventory, sales, and stock levels
- Helping with catalog management and recommendations
- Answering questions about user accounts and orders

You have access to detailed information including:
- Book stock levels and sold quantities for each book
- Order details including customer names, emails, products, prices, and status
- Store statistics including total books, orders, users, stock, and sales

When mentioning specific books, always use double quotes around book titles.
Do not use asterisks (**) or any markdown formatting. Use plain text only.
Be concise, professional, and focused on administrative tasks.
Provide actionable advice and insights to help manage the bookstore effectively.`;

async function chatWithGemini(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid input: "message" is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const books = await retrieveRelevantBooks(message);
    const isNewestQuery = /\b(newest|latest|recent|new|just added|recently added)\b/i.test(message);
    const context = formatBooksForContext(books, false, isNewestQuery);

    const modelName = (process.env.GEMINI_MODEL || 'gemini-pro').trim();

    try {
      const genAI = getGeminiClient();
      
      const prompt = `${USER_SYSTEM_PROMPT}\n\nCatalog Context:\n\n${context}\n\nUser Question: ${message}`;
      
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      const reply = result.text || 'Sorry, I could not generate a response.';
      
      return res.json({
        reply,
        sources: (books || []).map(b => ({
          id: b._id,
          title: b.title,
          author: b.author,
          genres: b.genres,
          price: b.newPrice,
          coverImage: b.coverImage,
        })),
      });
    } catch (llmError) {
      const shortlist = (books || []).slice(0, 5);
      if (shortlist.length > 0) {
        const lines = shortlist.map(b => `- "${b.title}" by ${b.author}${b.newPrice != null ? ` — $${Number(b.newPrice).toFixed(2)}` : ''}`);
        const reply = `I can't reach the assistant right now, but based on our catalog, here are some options related to your request:\n\n${lines.join('\n')}\n\nTry again later for a more detailed answer.`;
        return res.json({
          reply,
          sources: shortlist.map(b => ({
            id: b._id,
            title: b.title,
            author: b.author,
            genres: b.genres,
            price: b.newPrice,
            coverImage: b.coverImage,
          })),
          fallback: true,
        });
      }
      return res.json({
        reply: 'I can\'t reach the assistant right now and could not find matching books in the catalog. Please try again later or refine your query.',
        sources: [],
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Chat error:', error?.response?.data || error?.message || error);
    const status = error?.status || error?.response?.status || 500;
    const detail = error?.response?.data || error?.message || 'Unknown error';
    return res.status(status).json({ error: 'Failed to generate response.', detail });
  }
}

module.exports = { chatWithGemini };

async function healthCheck(req, res) {
  try {
    const modelName = (process.env.GEMINI_MODEL || 'gemini-pro').trim();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ ok: false, error: 'GEMINI_API_KEY missing' });
    }
    const genAI = getGeminiClient();
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: 'ping',
    });
    return res.json({ ok: true, model: modelName });
  } catch (error) {
    const status = error?.status || error?.response?.status || 500;
    const detail = error?.response?.data || error?.message || 'Unknown error';
    return res.status(status).json({ ok: false, error: 'Health check failed', detail });
  }
}

module.exports.healthCheck = healthCheck;

async function chatWithGeminiAdmin(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid input: "message" is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const books = await retrieveRelevantBooks(message);
    const isNewestQuery = /\b(newest|latest|recent|new|just added|recently added)\b/i.test(message);
    const bookContext = formatBooksForContext(books, true, isNewestQuery);
    const totalBooks = await Book.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ completed: false });
    const completedOrders = await Order.countDocuments({ completed: true });
    const totalUsers = await User.countDocuments();
    
    const stockStats = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' },
          totalSold: { $sum: '$soldQuantity' },
          lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', 5] }, 1, 0] } }
        }
      }
    ]);
    const stats = stockStats[0] || { totalStock: 0, totalSold: 0, lowStockCount: 0 };
    
    const allCompletedOrders = await Order.find({ completed: true })
      .select('totalPrice products')
      .populate('products.productId', 'title newPrice')
      .lean();
    const totalRevenueFromCompleted = allCompletedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    
    const totalProductsSold = allCompletedOrders.reduce((sum, order) => {
      const orderQuantity = order.products?.reduce((qtySum, product) => qtySum + (product.quantity || 0), 0) || 0;
      return sum + orderQuantity;
    }, 0);
    
    const bestSellersByRevenue = await Order.aggregate([
      { $match: { completed: true } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalRevenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
          totalQuantity: { $sum: "$products.quantity" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);
    
    const bestSellerIds = bestSellersByRevenue.map(item => item._id);
    const bestSellerBooks = await Book.find({ _id: { $in: bestSellerIds } })
      .select('title authorId')
      .populate('authorId', 'name')
      .lean();
    
    const bestSellersMap = {};
    bestSellerBooks.forEach(book => {
      bestSellersMap[book._id.toString()] = {
        title: book.title,
        author: book.authorId?.name || 'Unknown'
      };
    });
    
    const top5BestSellersByRevenue = bestSellersByRevenue.map((item, idx) => {
      const book = bestSellersMap[item._id.toString()] || { title: 'Unknown', author: 'Unknown' };
      return `${idx + 1}. "${book.title}" by ${book.author} - Revenue: $${item.totalRevenue.toFixed(2)}, Units Sold: ${item.totalQuantity}`;
    }).join('\n');
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('products.productId', 'title')
      .select('name email totalPrice completed createdAt products')
      .lean();

    const adminContext = `Store Statistics:
    - Total Books: ${totalBooks}
    - Total Orders: ${totalOrders} (${completedOrders} completed, ${pendingOrders} pending)
    - Total Revenue from ALL Completed Orders: $${totalRevenueFromCompleted.toFixed(2)}
    - Total Products Sold (from completed orders): ${totalProductsSold} units
    - Total Users: ${totalUsers}
    - Total Stock: ${stats.totalStock} units
    - Total Sold (from book records): ${stats.totalSold} units
    - Low Stock Books (≤5 units): ${stats.lowStockCount}

    Top 5 Best Sellers by Revenue (from completed orders):
    ${top5BestSellersByRevenue || 'No sales data available yet.'}

    Recent Orders (last 10, for reference only - revenue is calculated from ALL ${completedOrders} completed orders):
    ${recentOrders.map((o, idx) => {
      const products = o.products?.map(p => p.productId?.title || 'Unknown').join(', ') || 'No products';
      return `${idx + 1}. ${o.name} (${o.email}) - $${o.totalPrice} - ${o.completed ? 'Completed' : 'Pending'} - Products: ${products}`;
    }).join('\n')}

    Catalog Context (with stock and sales):
    ${bookContext}`;

    const modelName = (process.env.GEMINI_MODEL || 'gemini-pro').trim();

    try {
      const genAI = getGeminiClient();
      
      const prompt = `${ADMIN_SYSTEM_PROMPT}\n\n${adminContext}\n\nAdmin Question: ${message}`;
      
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      const reply = result.text || 'Sorry, I could not generate a response.';
      
      return res.json({
        reply,
        sources: (books || []).map(b => ({
          id: b._id,
          title: b.title,
          author: b.author,
          genres: b.genres,
          price: b.newPrice,
          coverImage: b.coverImage,
        })),
      });
    } catch (llmError) {
      const shortlist = (books || []).slice(0, 5);
      if (shortlist.length > 0) {
        const lines = shortlist.map(b => `- "${b.title}" by ${b.author}${b.newPrice != null ? ` — $${Number(b.newPrice).toFixed(2)}` : ''}`);
        const reply = `I can't reach the assistant right now, but here's what I found in the catalog:\n\n${lines.join('\n')}\n\nStore Stats: ${totalBooks} books, ${totalOrders} orders (${pendingOrders} pending), ${totalUsers} users.\n\nTry again later for a more detailed answer.`;
        return res.json({
          reply,
          sources: shortlist.map(b => ({
            id: b._id,
            title: b.title,
            author: b.author,
            genres: b.genres,
            price: b.newPrice,
            coverImage: b.coverImage,
          })),
          fallback: true,
        });
      }
      return res.json({
        reply: `I can't reach the assistant right now. Store Stats: ${totalBooks} books, ${totalOrders} orders (${pendingOrders} pending), ${totalUsers} users. Please try again later or refine your query.`,
        sources: [],
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Admin chat error:', error?.response?.data || error?.message || error);
    const status = error?.status || error?.response?.status || 500;
    const detail = error?.response?.data || error?.message || 'Unknown error';
    return res.status(status).json({ error: 'Failed to generate response.', detail });
  }
}

module.exports.chatWithGeminiAdmin = chatWithGeminiAdmin;

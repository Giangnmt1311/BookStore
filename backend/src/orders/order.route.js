const express = require('express');
const { createAOrder, getOrderByEmail, getAllOrders, updateOrderStatus, deleteOrder, confirmOrderReceipt } = require('./order.controller');

const router =  express.Router();

router.post("/", createAOrder);
router.get("/email/:email", getOrderByEmail);
router.get("/", getAllOrders);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/confirm-receipt", confirmOrderReceipt);
router.delete("/:id", deleteOrder);

module.exports = router;
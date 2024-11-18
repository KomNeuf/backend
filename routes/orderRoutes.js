const express = require("express");
const {
  createOrder,
  getOrdersByStatus,
  updateOrderStatus,
  getAllOrders,
  getOrderById,
} = require("../controllers/orderController");

const orderRoutes = express.Router();

orderRoutes.post("/create", createOrder);
orderRoutes.put("/status/:id", updateOrderStatus);
orderRoutes.get("/get-all-orders", getOrdersByStatus);
orderRoutes.get("/all-orders", getAllOrders);
orderRoutes.get("/getOrderById/:id", getOrderById);

module.exports = orderRoutes;

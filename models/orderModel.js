const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  shippingAddress: {
    type: Object,
    required: true,
  },
  paymentMethod: {
    type: String,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
  },
  paymentIntentId: {
    type: String,
  },
  status: {
    type: String,
    enum: [
      "All",
      "In Progress",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Completed",
    ],
    default: "In Progress",
  },
  senditDelivery: {},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;

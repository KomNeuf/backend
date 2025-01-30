const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    photos: [String],
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: {
      type: String,
      required: true,
    },
    specificItem: {
      type: String,
    },
    brand: {
      type: String,
    },
    size: {
      type: String,
    },
    rib: {
      type: String,
    },
    bankName: {
      type: String,
    },
    condition: {
      type: String,
    },
    color: {
      type: String,
    },
    materials: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    visibleStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminComment: {
      type: String,
      default: "",
    },
    likes: [],
    price: {
      type: Number,
      required: true,
    },

    shippingCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Available", "Sold Out"],
      default: "Available",
    },
    shippingOffer: {
      type: Boolean,
      default: false,
    },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    viewCount: { type: Number, default: 0 },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    referenceNumber: { type: String, unique: true },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

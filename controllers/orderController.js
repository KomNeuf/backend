const Notification = require("../models/notificationModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const FormData = require("form-data");
const axios = require("axios");
const { default: mongoose } = require("mongoose");
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status, userType, userId } = req.query;

    let query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (userType === "bought") {
      query.buyer = userId;
    } else if (userType === "sold") {
      query.seller = userId;
    }

    const orders = await Order.find(query)
      .populate("buyer")
      .populate("seller")
      .populate("product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const getDistrictId = async (cityName) => {
  try {
    const response = await axios.get("https://app.sendit.ma/api/v1/districts", {
      params: { querystring: cityName },
      headers: {
        // Authorization: `Bearer ${SENDIT_API_KEY}`,
        Authorization: `Bearer 919054|xQ7VDx5lt2OENh8LkUH0uf0OPR6L2tpBzbetCvnf`,
        "Content-Type": "application/json",
      },
    });

    if (response.data.success && response.data.data.length > 0) {
      const districtId = response.data.data[0].id;

      // districtCache.set( , districtId);
      return districtId;
    } else {
      console.error(`No districts found for city: ${cityName}`);
      return null;
    }
  } catch (error) {
    console.error(
      `Error fetching district ID for city ${cityName}:`,
      error.message
    );
    return null;
  }
};

exports.createOrder = async (req, res) => {
  const { buyer, seller } = req.body;

  try {
    const order = new Order({ ...req.body });
    const savedOrder = await order.save();

    const newOrder = await Order.findById(savedOrder._id)
      .populate("buyer")
      .populate("seller");

    if (!newOrder) {
      return res.status(400).json({
        success: false,
        message: "Order not found after saving",
      });
    }

    const buyerCity = newOrder?.shippingAddress?.city;

    if (!buyerCity) {
      await Order.deleteOne({ _id: savedOrder._id });
      return res.status(400).json({
        success: false,
        message: "Buyer city is missing",
      });
    }

    const districtId = await getDistrictId(buyerCity);
    const pickupDistrictId = 2;

    if (!districtId || !pickupDistrictId) {
      await Order.deleteOne({ _id: savedOrder._id });
      return res.status(400).json({
        success: false,
        message: "Invalid district IDs fetched from Sendit",
      });
    }

    const deliveryData = {
      pickup_district_id: pickupDistrictId,
      district_id: districtId,
      name: newOrder?.buyer?.name,
      amount: newOrder.totalPrice,
      address: newOrder?.buyer?.shipping?.address || "Unknown Address",
      phone: newOrder?.buyer?.shipping?.phone || "0661460360",
      products: newOrder.product?.referenceNumber || newOrder.product?._id,
      allow_open: 1,
      comment: "No Comment",
      allow_try: 1,
      products_from_stock: 0,
      option_exchange: 0,
      delivery_exchange_id: "",
    };

    try {
      const response = await axios.post(
        "https://app.sendit.ma/api/v1/deliveries",
        deliveryData,
        {
          headers: {
            Authorization: `Bearer 919054|xQ7VDx5lt2OENh8LkUH0uf0OPR6L2tpBzbetCvnf`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        newOrder.senditDelivery = response.data.data;
        await newOrder.save();

        // await Product.findByIdAndUpdate(newOrder.product, {
        //   status: "Sold Out",
        // });

        const product = await Product.findById(newOrder?.product);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }

        const updatedQuantity = product?.quantity - newOrder?.quantity;
        const updateData = {};
        if (updatedQuantity <= 0) {
          updateData.status = "Sold Out";
          updateData.quantity = 0;
        } else {
          updateData.quantity = updatedQuantity;
        }

        await Product.findByIdAndUpdate(newOrder?.product, updateData);

        const sender = await User.findById(buyer);
        const senderName = sender ? sender.name : "Unknown";

        const notificationEntry = new Notification({
          userId: seller,
          productId: newOrder.product,
          senderId: buyer,
          message: `You have a new order from ${senderName}`,
          detail: `Check your orders for more details.`,
        });

        await notificationEntry.save();

        global.io.to(seller).emit("newNotification", {
          message: `You have a new order from ${senderName}`,
          userId: seller,
          senderId: {
            id: buyer,
            avatar: sender?.avatar,
          },
          detail: `Order ID: ${newOrder._id}. Check your orders for more details.`,
          data: notificationEntry,
          time: new Date(),
        });

        return res.status(201).json({
          success: true,
          message: "Order and delivery created successfully!",
          data: newOrder,
        });
      } else {
        await Order.deleteOne({ _id: savedOrder._id });
        return res.status(500).json({
          success: false,
          message: "Error creating delivery in Sendit",
        });
      }
    } catch (error) {
      console.error("Sendit API Error:", error.message);
      await Order.deleteOne({ _id: savedOrder._id });
      return res.status(500).json({
        success: false,
        message: "Error creating delivery in Sendit",
        error: error.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const productId = order.product;
    const quantityOrdered = order.quantity;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    if (newStatus === "Cancelled") {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { quantity: quantityOrdered } },
        { new: true }
      );

      if (product.quantity > 0) {
        product.status = "Available";
      } else {
        product.status = "Sold Out";
      }
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("buyer")
      .populate("seller")
      .populate("product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("buyer")
      .populate("seller")
      .populate("product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

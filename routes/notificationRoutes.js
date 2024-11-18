const express = require("express");
const {
  createNotification,
  getAllNotifications,
  getUserNotifications,
  getSingleNotification,
  deleteNotification,
  updateNotification,
} = require("../controllers/notificationController");

const notificationRoutes = express.Router();

notificationRoutes.post("/create", createNotification);

notificationRoutes.get("/get-all", getAllNotifications);

notificationRoutes.get("/user/:userId", getUserNotifications);

notificationRoutes.get("/:id", getSingleNotification);
notificationRoutes.put("/update/:id", updateNotification);

notificationRoutes.delete("/delete/:id", deleteNotification);

module.exports = notificationRoutes;

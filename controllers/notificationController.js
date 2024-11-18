const Notification = require("../models/notificationModel");

exports.createNotification = async (req, res) => {
  try {
    const notificationEntry = new Notification({
      ...req.body,
    });

    const newNotificationEntry = await notificationEntry.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: newNotificationEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notification creation failed",
      error: error.message,
    });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("userId")
      .populate("productId")
      .populate("senderId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications",
      error: error.message,
    });
  }
};

exports.getSingleNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const notificationEntry = await Notification.findById(id)
      .populate("userId")
      .populate("productId")
      .populate("senderId");

    if (!notificationEntry) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notificationEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notification",
      error: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNotificationEntry = await Notification.findByIdAndDelete(id);

    if (!deletedNotificationEntry) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notification deletion failed",
      error: error.message,
    });
  }
};

exports.getUserNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await Notification.find({ userId })
      .populate("userId")
      .populate("productId")
      .populate("senderId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user notifications",
      error: error.message,
    });
  }
};

exports.updateNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Notification.updateMany(
      { userId: id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
      error: error.message,
    });
  }
};

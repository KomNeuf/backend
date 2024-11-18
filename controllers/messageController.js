const Message = require("../models/messageModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

const cloudinary = require("cloudinary").v2;

exports.getChatUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getChatUsersWithLastMessage = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      isArchived: false,
    });

    if (messages.length === 0) {
      return res.status(404).json({ error: "No chats found for this user" });
    }

    const chatUserIds = new Set();

    messages.forEach((message) => {
      if (message.senderId.toString() !== userId) {
        chatUserIds.add(message.senderId.toString());
      }
      if (message.receiverId.toString() !== userId) {
        chatUserIds.add(message.receiverId.toString());
      }
    });

    const uniqueChatUserIds = Array.from(chatUserIds);

    const chatUsers = await User.find({ _id: { $in: uniqueChatUserIds } });

    const chatUsersWithLastMessage = [];

    for (const chatUser of chatUsers) {
      const lastMessage = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: chatUser._id },
          { senderId: chatUser._id, receiverId: userId },
        ],
        isArchived: false,
      }).sort({ timestamp: -1 });

      chatUsersWithLastMessage.push({
        user: chatUser,
        lastMessage: lastMessage
          ? lastMessage.content
            ? lastMessage.content
            : lastMessage.images
            ? "Photo"
            : "No messages yet"
          : "No messages yet",
      });
    }

    res.status(200).json({ success: true, data: chatUsersWithLastMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, images } = req.body;
    if (
      !senderId ||
      !receiverId ||
      (!content && (!images || images.length === 0))
    ) {
      return res.status(400).json({
        error:
          "Sender, receiver, and at least one of content or images are required",
      });
    }

    let imageUrls = [];

    if (images && images.length > 0) {
      for (const img of images) {
        if (img.startsWith("data:image/")) {
          const result = await cloudinary.uploader.upload(img, {
            resource_type: "image",
          });
          imageUrls.push(result.secure_url);
        }
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      content,
      images: imageUrls,
      timestamp: new Date(),
    });

    await newMessage.save();

    const sender = await User.findById(senderId);
    const senderName = sender ? sender.name : "Unknown";
    const notificationEntry = new Notification({
      userId: receiverId,
      senderId: senderId,
      message: `You have a new message from ${senderName}`,
      detail: "Check your messages for more details.",
    });

    await notificationEntry.save();

    global.io.to(receiverId).emit("newNotification", {
      message: `You have a new message from ${senderName}`,
      userId: receiverId,
      senderId: {
        id: senderId,
        avatar: sender?.avatar,
      },
      detail: "Check your messages for more details.",
      data: notificationEntry,
      time: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Message created successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ error: "Sender ID and Receiver ID are required" });
    }

    const messages = await Message.find({
      $or: [
        {
          senderId,
          receiverId,
          deletedBySender: false,
        },
        {
          senderId: receiverId,
          receiverId: senderId,
          deletedByReceiver: false,
        },
      ],
    }).sort({ timestamp: 1 });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, seen } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { content, seen },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    res
      .status(200)
      .json({ message: "Message updated successfully", data: updatedMessage });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateSeenMessage = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const updatedMessages = await Message.updateMany(
      {
        senderId: receiverId,
        receiverId: senderId,
        seen: false,
      },
      {
        $set: { seen: true },
      }
    );

    res.status(200).json({
      message: "Messages updated successfully",
      data: updatedMessages,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId, userId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() === userId) {
      message.deletedBySender = true;
    } else if (message.receiverId.toString() === userId) {
      message.deletedByReceiver = true;
    } else {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this message" });
    }

    await message.save();

    res.status(200).json({
      message: "Message deleted successfully for the user",
      data: message,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteChatMessages = async (req, res) => {
  try {
    const { userId, chatUserId } = req.params;

    if (!userId || !chatUserId) {
      return res
        .status(400)
        .json({ error: "User ID and Chat User ID are required" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: chatUserId },
        { senderId: chatUserId, receiverId: userId },
      ],
    });

    const updateOps = messages.map((message) => {
      let update = {};
      if (message.senderId.toString() === userId) {
        update.deletedBySender = true;
      }
      if (message.receiverId.toString() === userId) {
        update.deletedByReceiver = true;
      }
      return Message.updateOne({ _id: message._id }, { $set: update });
    });

    const results = await Promise.all(updateOps);

    res.status(200).json({
      success: true,
      message: "Messages deleted successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error deleting messages:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};

exports.toggleArchiveConversation = async (req, res) => {
  try {
    const { userId, chatUserId } = req.params;

    const existingMessages = await Message.find({
      $or: [
        { senderId: userId, receiverId: chatUserId },
        { senderId: chatUserId, receiverId: userId },
      ],
    });

    if (existingMessages.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No messages found" });
    }

    const isCurrentlyArchived = existingMessages.some((msg) => msg.isArchived);

    const updatedMessages = await Message.updateMany(
      {
        $or: [
          { senderId: userId, receiverId: chatUserId },
          { senderId: chatUserId, receiverId: userId },
        ],
      },
      { $set: { isArchived: !isCurrentlyArchived } }
    );

    res.status(200).json({
      success: true,
      message: `Conversation ${
        isCurrentlyArchived ? "unarchived" : "archived"
      } successfully`,
      action: isCurrentlyArchived ? "unarchived" : "archived",
      data: updatedMessages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.markConversationAsImportant = async (req, res) => {
  try {
    const { userId, chatUserId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.importantChats.includes(chatUserId)) {
      user.importantChats = user.importantChats.filter(
        (id) => id !== chatUserId
      );
    } else {
      user.importantChats.push(chatUserId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Conversation updated successfully",
      importantChats: user.importantChats,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getArchivedConversations = async (req, res) => {
  const { userId } = req.params;

  try {
    const archivedMessages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      isArchived: true,
    }).sort({ timestamp: -1 });

    const userIds = new Set();

    archivedMessages.forEach((message) => {
      if (message.senderId.toString() !== userId) {
        userIds.add(message.senderId.toString());
      }
      if (message.receiverId.toString() !== userId) {
        userIds.add(message.receiverId.toString());
      }
    });

    const uniqueUserIds = Array.from(userIds);

    const users = await User.find({ _id: { $in: uniqueUserIds } });

    const responseData = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: user._id },
            { senderId: user._id, receiverId: userId },
          ],
          isArchived: true,
        }).sort({ timestamp: -1 });
        return {
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
          lastMessage: lastMessage
            ? lastMessage.content
              ? lastMessage.content
              : lastMessage.images
              ? "Photo"
              : "No messages yet"
            : "No messages yet",
        };
      })
    );

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

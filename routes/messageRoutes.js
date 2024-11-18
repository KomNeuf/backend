const express = require("express");
const messageRouter = express.Router();

const {
  createMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  getChatUser,
  updateSeenMessage,
  deleteChatMessages,
  getChatUsersWithLastMessage,
  markConversationAsImportant,
  getArchivedConversations,
  toggleArchiveConversation,
} = require("../controllers/messageController");

messageRouter.post("/", createMessage);
messageRouter.get("/", getMessages);
messageRouter.get("/chat-user/:userId", getChatUser);
messageRouter.get("/get-all-chat-users/:userId", getChatUsersWithLastMessage);
messageRouter.put(
  "/update-seen-messages/:senderId/:receiverId",
  updateSeenMessage
);
messageRouter.put("/:messageId", updateMessage);
messageRouter.delete("/:messageId", deleteMessage);
messageRouter.delete(
  "/delete-chat-messages/:userId/:chatUserId",
  deleteChatMessages
);

messageRouter.put("/archive/:userId/:chatUserId", toggleArchiveConversation);
messageRouter.put(
  "/mark-important/:userId/:chatUserId",
  markConversationAsImportant
);
messageRouter.get("/get-archived/:userId", getArchivedConversations);

module.exports = messageRouter;

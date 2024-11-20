const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const NodeCache = require("node-cache");
const bodyParser = require("body-parser");
const http = require("http");
const axios = require("axios");
const socketIo = require("socket.io");
const fileUpload = require("express-fileupload");
const { userRoutes } = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const { reviewRoutes } = require("./routes/reviewRoutes");
const messageRouter = require("./routes/messageRoutes");
const orderRoutes = require("./routes/orderRoutes");
const advertiseRoutes = require("./routes/advertiseRoutes");
const contactUsRoutes = require("./routes/contactRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI, {});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
mongoose.connection.on("open", () => {
  console.log("Connected to MongoDB");
});
const myCache = new NodeCache();
module.exports = myCache;

const server = http.createServer(app);
global.io = socketIo(server, {
  cors: {
    // origin: "http://localhost:3000",
    origin: "https://kiff-new-frontend.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// Using Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/contact", contactUsRoutes);
app.use("/api/v1/advertise", advertiseRoutes);
app.use("/api/v1/notification", notificationRoutes);

async function getExchangeRate() {
  const response = await axios.get(
    "https://api.exchangerate-api.com/v4/latest/MAD"
  );
  return response.data.rates.EUR;
}

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: "Invalid amount provided." });
  }

  try {
    const exchangeRate = await getExchangeRate();
    const amountInEUR = Math.round(amount * exchangeRate);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInEUR,
      currency: "eur",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});

io.on("connection", (socket) => {
  // console.log("A user connected:", socket.id);
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
  });

  socket.on("sendMessage", (message) => {
    if (
      message &&
      message.receiverId &&
      (message.content || (message.images && message.images.length > 0))
    ) {
      io.to(message.receiverId).emit("receiveMessage", message);
    } else {
      console.error("Invalid message data:", message);
    }
  });
  socket.on("typing", ({ receiverId, senderId }) => {
    io.to(receiverId).emit("userTyping", { senderId });
  });

  socket.on("stopTyping", ({ receiverId, senderId }) => {
    io.to(receiverId).emit("userStoppedTyping", { senderId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
app.get("/", (req, res) => {
  res.send("Hello from MERN server!");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

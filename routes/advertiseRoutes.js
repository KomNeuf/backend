const express = require("express");
const {
  createAdvertise,
  getAllAdvertisements,
  getSingleAdvertisement,
  editAdvertisement,
  deleteAdvertisement,
} = require("../controllers/advertiseController");

const advertiseRoutes = express.Router();

advertiseRoutes.post("/create", createAdvertise);
advertiseRoutes.get("/get-all-advertise", getAllAdvertisements);
advertiseRoutes.get("/getAdvertiseById/:id", getSingleAdvertisement);
advertiseRoutes.put("/update/:id", editAdvertisement);
advertiseRoutes.delete("/delete/:id", deleteAdvertisement);

module.exports = advertiseRoutes;

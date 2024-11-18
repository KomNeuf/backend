const express = require("express");
const {
  createContactUs,
  getAllContacts,
  getSingleContact,
  editContact,
  deleteContact,
} = require("../controllers/contactController");

const contactUsRoutes = express.Router();

contactUsRoutes.post("/create", createContactUs);
contactUsRoutes.get("/get-all", getAllContacts);
contactUsRoutes.get("/:id", getSingleContact);
contactUsRoutes.put("/update/:id", editContact);
contactUsRoutes.delete("/delete/:id", deleteContact);

module.exports = contactUsRoutes;

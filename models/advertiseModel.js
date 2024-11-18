const mongoose = require("mongoose");

const advertiseSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    company: {
      type: String,
    },
    companyType: {
      type: String,
    },
    country: {
      type: String,
    },
    budget: {
      type: String,
    },
    campaign: {
      type: String,
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Advertise = mongoose.model("Advertise", advertiseSchema);

module.exports = Advertise;

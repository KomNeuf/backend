const Advertise = require("../models/advertiseModel");

exports.createAdvertise = async (req, res) => {
  try {
    const advertisement = new Advertise({
      ...req.body,
    });

    const newAdvertisement = await advertisement.save();

    res.status(201).json({
      success: true,
      message: "Advertisement creation Successfully",
      data: newAdvertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Advertisement creation failed",
      error: error.message,
    });
  }
};

exports.getAllAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertise.find();
    res.status(200).json({
      success: true,
      data: advertisements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve advertisements",
      error: error.message,
    });
  }
};

exports.getSingleAdvertisement = async (req, res) => {
  const { id } = req.params;

  try {
    const advertisement = await Advertise.findById(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: advertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve advertisement",
      error: error.message,
    });
  }
};

exports.editAdvertisement = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedAdvertisement = await Advertise.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedAdvertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Advertisement updated successfully",
      data: updatedAdvertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Advertisement update failed",
      error: error.message,
    });
  }
};

exports.deleteAdvertisement = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAdvertisement = await Advertise.findByIdAndDelete(id);

    if (!deletedAdvertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Advertisement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Advertisement deletion failed",
      error: error.message,
    });
  }
};

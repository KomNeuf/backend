const ContactUs = require("../models/contactModel");

exports.createContactUs = async (req, res) => {
  try {
    const contactEntry = new ContactUs({
      ...req.body,
    });

    const newContactEntry = await contactEntry.save();

    res.status(201).json({
      success: true,
      message: "Contact entry created successfully",
      data: newContactEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Contact entry creation failed",
      error: error.message,
    });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await ContactUs.find();
    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contacts",
      error: error.message,
    });
  }
};

exports.getSingleContact = async (req, res) => {
  const { id } = req.params;

  try {
    const contactEntry = await ContactUs.findById(id);

    if (!contactEntry) {
      return res.status(404).json({
        success: false,
        message: "Contact entry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contactEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contact entry",
      error: error.message,
    });
  }
};

exports.editContact = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedContactEntry = await ContactUs.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedContactEntry) {
      return res.status(404).json({
        success: false,
        message: "Contact entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact entry updated successfully",
      data: updatedContactEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Contact entry update failed",
      error: error.message,
    });
  }
};

exports.deleteContact = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedContactEntry = await ContactUs.findByIdAndDelete(id);

    if (!deletedContactEntry) {
      return res.status(404).json({
        success: false,
        message: "Contact entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact entry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Contact entry deletion failed",
      error: error.message,
    });
  }
};

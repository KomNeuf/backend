const Review = require("../models/reviewModel");
const User = require("../models/userModel");

exports.addReview = async (req, res) => {
  try {
    const { reviewerId, rating, reviewText, reviewedUserId } = req.body;

    const review = await Review.create({
      reviewer: reviewerId,
      reviewedUser: reviewedUserId,
      rating,
      reviewText,
    });

    await User.findByIdAndUpdate(reviewedUserId, {
      $push: { reviews: review._id },
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllUsersReviews = async (req, res) => {
  const { userId } = req.params;
  try {
    const reviews = await Review.find({ reviewedUser: userId })
      .populate("reviewer", "name avatar")
      .populate("replies.replier", "name avatar");

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.rating = rating || review.rating;
    review.reviewText = reviewText || review.reviewText;

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Remove review from the user's reviews array
    await User.findByIdAndUpdate(review.reviewer, {
      $pull: { reviews: reviewId },
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addReplyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { replyText, replierId } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.replies.push({
      replyText,
      replier: replierId,
    });

    await review.save();

    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

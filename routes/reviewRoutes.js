const express = require("express");
const reviewsController = require("../controllers/reviewController");

const reviewRoutes = express.Router();

reviewRoutes.post("/add-review", reviewsController.addReview);

reviewRoutes.get(
  "/get-all-reviews/:userId",
  reviewsController.getAllUsersReviews
);

reviewRoutes.put("/update-review/:reviewId", reviewsController.updateReview);

reviewRoutes.delete("/delete-review/:reviewId", reviewsController.deleteReview);

reviewRoutes.post(
  "/reply/:reviewId/replies",
  reviewsController.addReplyToReview
);

module.exports = { reviewRoutes };

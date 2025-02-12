const express = require("express");
const router = express.Router();

const db = require("../config/mysql");
const mongoose = require("../config/mongodb");

// Import models
const { Review, ReviewModel } = require("../models/Review");

// Import middleware authenticateToken
const {
  authenticateToken,
  isStaffMember,
  isAdmin,
} = require("../middlewares/authenticateToken");

router.post("/create-review/:id", authenticateToken, async (req, res) => {
  const { reviewData } = req.body;
  const passengerId = req.user.id;
  const bookingId = req.params.id;

  try {
    const newReview = new Review({
      ...reviewData,
      booking: bookingId,
    });

    const savedReview = await newReview.save();
    res
      .status(201)
      .json({ message: "Review created successfully", review: savedReview });
  } catch (error) {
    console.error("Error creating review: " + error);
    res
      .status(500)
      .json({ message: "Error creating review: " + error.message });
  }
});

router.get("/reviews-driver/:id", async (req, res) => {
  const driverId = req.params.id;

  try {
    const reviews = await ReviewModel.getReviewsByDriver(driverId);
    res.status(200).json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching review: " + error.message });
  }
});

router.put("/update-review/:id", isStaffMember, async (req, res) => {
  const reviewId = req.params.id;
  const updatedData = req.body;

  try {
    const review = await Review.findByIdAndUpdate(reviewId, updatedData, {
      new: true,
    }).populate("booking");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (updatedData.wasRideOk === true) {
      const creditsPerPassenger = review.booking.ride.creditsPerPassenger;
      const userId = review.booking.bookingDetails.passenger.passengerId;
      const EcorideCommission = 2;

      const creditsToDriver = creditsPerPassenger - EcorideCommission;

      const updateUserQuery = `
        UPDATE users 
        SET credits = ?
        WHERE account_id = ?;
      `;

      await db.query(updateUserQuery, [creditsToDriver, userId]);
    }

    res.status(200).json(review);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating review: " + error.message });
  }
});

router.get("/reviews-summary/:id", async (req, res) => {
  const driverId = req.params.id;

  try {
    const summary = await ReviewModel.getSummary(driverId);
    res.status(200).json(summary);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reviews summary: " + error.message });
  }
});

module.exports = router;

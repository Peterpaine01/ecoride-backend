const db = require("../config/mysql");
const mongoose = require("../config/mongodb");

// Import models
const { Booking, BookingModel } = require("./Booking");

const reviewSchema = new mongoose.Schema({
  title: String,
  note: Number,
  comment: String,
  wasRideOk: Boolean,
  complain: String,
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
});

const Review = mongoose.model("Review", reviewSchema);

class ReviewModel {
  static async createReview(bookingId, reviewData) {
    try {
      const newReview = new Review({ ...reviewData, booking: bookingId });

      const savedReview = await newReview.save();

      const booking = await BookingModel.getBookingById(bookingId).populate(
        "ride"
      );

      if (reviewData.wasRideOk === true) {
        const creditsPerPassenger = booking.ride.creditsPerPassenger;
        const EcorideCommission = 2;

        const creditsToDriver = creditsPerPassenger - EcorideCommission;

        const updateUserQuery = `
          UPDATE users 
          SET credits = ?
          WHERE account_id = ?;
        `;

        await db.query(updateUserQuery, [creditsToDriver, userId]);
      }

      await ReviewModel.setSummary(reviewData.driverId);

      return savedReview;
    } catch (error) {
      throw new Error("Error while creating review: " + error.message);
    }
  }

  static async getReviewById(reviewId) {
    try {
      const review = await Review.findById(reviewId).populate("booking");

      return review;
    } catch (error) {
      throw new Error("Review not found: " + error.message);
    }
  }

  static async getReviewsByDriver(driverId) {
    try {
      const reviews = await Review.find({
        "driver.driverId": driverId,
      }).populate("booking");

      if (!reviews || reviews.length === 0) {
        throw new Error("No reviews found for this driver");
      }

      return reviews;
    } catch (error) {
      console.error("Erreur lors de la récupération des rides: " + error);
      throw new Error(
        "Erreur lors de la récupération des rides: " + error.message
      );
    }
  }

  static async setSummary(driverId) {
    try {
      // Fetch all reviews from MongoDB
      const result = await Review.aggregate([
        { $match: { driverId } }, // Filter reviews for this driver
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$note" }, // Calculate average note
            totalReviews: { $sum: 1 }, // Count reviews
          },
        },
      ]);

      const averageRating = result.length > 0 ? result[0].avgRating : 0;
      const totalReviews = result.length > 0 ? result[0].totalReviews : 0;

      // Insert or Update in reviews_summaries table
      await db.query(
        `INSERT INTO reviews_summaries (driver_id, average_rating, total_reviews)
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         average_rating = VALUES(average_rating), 
         total_reviews = VALUES(total_reviews)`,
        [driverId, averageRating, totalReviews]
      );
    } catch (error) {
      throw new Error("Error interting/updating review: " + error.message);
    }
  }

  static async getSummary(driverId) {
    try {
      const [rows] = await db.query(
        `SELECT average_rating, total_reviews 
         FROM reviews_summaries 
         WHERE driver_id = ?`,
        [driverId]
      );

      if (rows.length > 0) {
        return {
          averageRating: rows[0].average_rating,
          totalReviews: rows[0].total_reviews,
        };
      }
      return { averageRating: 0, totalReviews: 0 }; // Default values if no data
    } catch (error) {
      throw new Error("Error while fetching summary: " + error.message);
    }
  }
}

module.exports = { Review, ReviewModel };

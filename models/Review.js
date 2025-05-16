const db = require("../config/mysql")
const mongoose = require("../config/mongodb")

// Import models
const { Booking, BookingModel } = require("./Booking")
const User = require("../models/User")

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
  passengerId: Number,
  driverId: Number,
  isPublished: {
    type: Boolean,
    default: false,
  },
})

const Review = mongoose.model("Review", reviewSchema)

class ReviewModel {
  static async createReview(bookingId, reviewData) {
    const { BookingModel } = require("./Booking")
    try {
      const bookingToReview = await Booking.findById(bookingId).populate("ride")

      const passenegrId = bookingToReview.bookingDetails.passenger.passengerId
      const driverId = bookingToReview.bookingDetails.driver.driverId

      if (!driverId) {
        throw new Error("driverId is missing from bookingToReview")
      }

      const newReview = new Review({
        ...reviewData,
        booking: bookingId,
        passengerId: passenegrId,
        driverId: driverId,
      })

      const savedReview = await newReview.save()

      if (reviewData.wasRideOk === true) {
        const creditsPerPassenger = bookingToReview.ride.creditsPerPassenger
        const EcorideCommission = 2
        const totalReservedSeats = bookingToReview.bookingDetails.seats

        const creditsToDriver =
          (creditsPerPassenger - EcorideCommission) * totalReservedSeats

        const updateUserQuery = `
          UPDATE users 
          SET credits = ?
          WHERE account_id = ?;
        `

        await db.query(updateUserQuery, [creditsToDriver, driverId])
        console.log("driver crédité")
      }

      await BookingModel.updateBooking(bookingId, { bookingStatus: "reviewed" })

      await ReviewModel.setSummary(driverId)

      return savedReview
    } catch (error) {
      throw new Error("Error while creating review: " + error.message)
    }
  }

  static async getReviewById(reviewId) {
    try {
      const review = await Review.findById(reviewId).populate("booking")

      return review
    } catch (error) {
      throw new Error("Review not found: " + error.message)
    }
  }

  static async getReviewsByDriver(driverId) {
    try {
      const reviews = await Review.find({ driverId }).populate("booking")

      const reviewsWithPassengerInfo = await Promise.all(
        reviews.map(async (review) => {
          const passengerId = review.passengerId

          console.log("passengerId", passengerId)

          let passengerInfo = null
          if (passengerId) {
            try {
              passengerInfo = await User.getUserById(passengerId)
            } catch (err) {
              console.error(
                `Erreur lors de la récupération de l'utilisateur ${passengerId}:`,
                err.message
              )
            }
          }

          return {
            ...review.toObject(),
            passenger: passengerInfo,
          }
        })
      )

      return reviewsWithPassengerInfo
    } catch (error) {
      console.error("Error fetching review: " + error)
      throw new Error("Error fetching review: " + error.message)
    }
  }

  static async setSummary(driverId) {
    try {
      // Fetch all reviews from MongoDB
      const result = await Review.aggregate([
        { $match: { driverId } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$note" },
            totalReviews: { $sum: 1 },
          },
        },
      ])

      const averageRating =
        result.length > 0 && result[0].avgRating !== null
          ? parseFloat(result[0].avgRating.toFixed(2))
          : 0.0
      const totalReviews = result.length > 0 ? result[0].totalReviews : 0

      await db.query(
        `INSERT INTO reviews_summaries (driver_id, average_rating, total_reviews)
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           average_rating = VALUES(average_rating), 
           total_reviews = VALUES(total_reviews)`,
        [driverId, averageRating, totalReviews]
      )
    } catch (error) {
      throw new Error("Error inserting/updating review: " + error.message)
    }
  }

  static async getSummary(driverId) {
    try {
      const [rows] = await db.query(
        `SELECT average_rating, total_reviews 
         FROM reviews_summaries 
         WHERE driver_id = ?`,
        [driverId]
      )

      if (rows.length > 0) {
        return {
          averageRating: rows[0].average_rating,
          totalReviews: rows[0].total_reviews,
        }
      }
      return { averageRating: 0.0, totalReviews: 0 }
    } catch (error) {
      throw new Error("Error fetching summary: " + error.message)
    }
  }
}

module.exports = { Review, ReviewModel }

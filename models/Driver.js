const User = require("./User")
const { Review, ReviewModel } = require("./Review")

const db = require("../config/mysql")

class Driver extends User {
  constructor(
    id,
    email,
    password,
    account_type = "user",
    account_status,
    created_at,
    deleted_at,
    verification_token,
    username,
    photo,
    credits,
    gender,
    is_driver,
    consent_data_retention,
    accept_smoking,
    accept_animals
  ) {
    super(
      id,
      email,
      password,
      account_type,
      account_status,
      created_at,
      deleted_at,
      verification_token,
      username,
      photo,
      credits,
      gender,
      account_status,
      is_driver,
      consent_data_retention
    )
    this.accept_smoking = accept_smoking
    this.accept_animals = accept_animals
  }
  static async createDriver(user_id) {
    console.log(" createDriver user_id -> ", user_id)

    try {
      // check if user already exists in table users
      const [userResults] = await db.query(
        "SELECT * FROM users WHERE account_id = ?",
        [user_id]
      )
      // console.log("userResults -> ", userResults);

      if (userResults.length === 0) {
        throw new Error("User does not exist")
      }

      // check if user is already a driver
      const [driverResults] = await db.query(
        "SELECT * FROM drivers WHERE user_id = ?",
        [user_id]
      )
      if (driverResults.length > 0) {
        throw new Error("User is already a driver")
      }

      // Insert in table drivers
      const query = "INSERT INTO drivers (user_id) VALUES (?)"
      await db.query(query, [user_id])

      // Set summary into table reviews_summaries
      await ReviewModel.setSummary(user_id)

      return user_id
    } catch (error) {
      throw error
    }
  }

  static async getDriverById(user_id) {
    try {
      // Get driver-specific fields
      const [driverResults] = await db.query(
        "SELECT user_id, accept_smoking, accept_animals FROM drivers WHERE user_id = ?",
        [user_id]
      )
      if (driverResults.length === 0) return null

      const driver = driverResults[0]

      // Get user fields
      const [userResults] = await db.query(
        "SELECT gender, photo, username FROM users WHERE account_id = ?",
        [user_id]
      )
      if (userResults.length > 0) {
        driver.gender = userResults[0].gender
        driver.photo = userResults[0].photo
        driver.username = userResults[0].username
      } else {
        driver.gender = null
      }

      // Get reviews summary
      const [reviewResults] = await db.query(
        `SELECT average_rating, total_reviews 
         FROM reviews_summaries 
         WHERE driver_id = ?`,
        [user_id]
      )

      if (reviewResults.length > 0) {
        driver.average_rating = Number(reviewResults[0].average_rating) || 0
        driver.total_reviews = Number(reviewResults[0].total_reviews) || 0
      } else {
        driver.average_rating = 0
        driver.total_reviews = 0
      }

      return driver
    } catch (error) {
      throw error
    }
  }
}

module.exports = Driver

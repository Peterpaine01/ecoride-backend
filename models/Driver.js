const User = require("./User");

const db = require("../config/mysql");

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
    );
    this.accept_smoking = accept_smoking;
    this.accept_animals = accept_animals;
  }
  static async createDriver(user_id) {
    console.log(" createDriver user_id -> ", user_id);

    try {
      // check if user already exists in table users
      const [userResults] = await db.query(
        "SELECT * FROM users WHERE account_id = ?",
        [user_id]
      );
      // console.log("userResults -> ", userResults);

      if (userResults.length === 0) {
        throw new Error("User does not exist");
      }

      // check if user is already a driver
      const [driverResults] = await db.query(
        "SELECT * FROM drivers WHERE user_id = ?",
        [user_id]
      );
      if (driverResults.length > 0) {
        throw new Error("User is already a driver");
      }

      // Insert in table drivers
      const query = "INSERT INTO drivers (user_id) VALUES (?)";
      await db.query(query, [user_id]);

      return user_id;
    } catch (error) {
      throw error;
    }
  }

  static async getDriverById(user_id) {
    try {
      const [driverResults] = await db.query(
        "SELECT accept_smoking, accept_animals FROM drivers WHERE user_id = ?",
        [user_id]
      );
      if (driverResults.length === 0) {
        return null; // No driver found
      }

      let driver = driverResults[0];
      driver.accept_smoking = Boolean(driver.accept_smoking);
      driver.accept_animals = Boolean(driver.accept_animals);

      return driver;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Driver;

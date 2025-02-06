const User = require("./User");

class Driver extends User {
  constructor(
    id,
    email,
    password,
    account_type = "user",
    created_at,
    deleted_at,
    username,
    photo,
    credits,
    gender,
    account_status,
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
      created_at,
      deleted_at,
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
  static async createDriver(connection, user_id) {
    console.log(" createDriver user_id -> ", user_id);

    try {
      // check if user already exists in table users
      const [userResults] = await connection
        .promise()
        .query("SELECT * FROM users WHERE account_id = ?", [user_id]);
      // console.log("userResults -> ", userResults);

      if (userResults.length === 0) {
        throw new Error("User does not exist");
      }

      // check if user is already a driver
      const [driverResults] = await connection
        .promise()
        .query("SELECT * FROM drivers WHERE user_id = ?", [user_id]);
      if (driverResults.length > 0) {
        throw new Error("User is already a driver");
      }

      // Insert in table drivers
      const query = "INSERT INTO drivers (user_id) VALUES (?)";
      await connection.promise().query(query, [user_id]);

      return user_id;
    } catch (err) {
      throw err;
    }
  }

  static async getDriverById(connection, user_id) {
    try {
      const [results] = await connection
        .promise()
        .query(
          "SELECT accept_smoking, accept_animals FROM drivers WHERE user_id = ?",
          [user_id]
        );

      return results.length > 0 ? results[0] : null;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Driver;

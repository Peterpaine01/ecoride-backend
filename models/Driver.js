const User = require("./User");

class Driver extends User {
  constructor(
    id,
    email,
    password,
    account_type = "user",
    username,
    photo,
    credits,
    gender,
    account_status,
    is_driver,
    accept_smoking,
    accept_animals
  ) {
    super(
      id,
      email,
      password,
      account_type,
      username,
      photo,
      credits,
      gender,
      account_status,
      is_driver
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

  static getDriverById(connection, id, callback) {
    const query = "SELECT * FROM drivers WHERE user_id = ?";
    connection.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  }
}

module.exports = Driver;

const Account = require("./Account");

class User extends Account {
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
    is_driver
  ) {
    super(id, email, password, account_type);
    this.username = username;
    this.photo = photo;
    this.credits = credits;
    this.gender = gender;
    this.account_status = account_status;
    this.is_driver = is_driver;
  }

  static async createUser(connection, account_id, username, gender, is_driver) {
    try {
      const query =
        "INSERT INTO users (account_id, username, gender, is_driver) VALUES (?, ?, ?, ?)";
      const [results] = await connection
        .promise()
        .query(query, [account_id, username, gender, is_driver]);

      return account_id;
    } catch (err) {
      throw err;
    }
  }

  static getUserById(connection, id, callback) {
    const query = "SELECT * FROM users WHERE id = ?";
    connection.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  }
}

module.exports = User;

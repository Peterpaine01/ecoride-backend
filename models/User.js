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

  static createUser(
    connection,
    email,
    password,
    firstName,
    lastName,
    role,
    callback
  ) {
    const query =
      "INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)";
    connection.query(
      query,
      [email, password, firstName, lastName, role],
      (err, results) => {
        if (err) {
          return callback(err, null);
        }
        callback(null, results.insertId);
      }
    );
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

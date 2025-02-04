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
    username,
    gender,
    is_driver,
    callback
  ) {
    // 1️⃣ Insérer l'utilisateur dans la table accounts
    const accountQuery =
      "INSERT INTO accounts (email, password, account_type) VALUES (?, ?, 'user')";

    connection.query(accountQuery, [email, password], (err, results) => {
      if (err) {
        return callback(err, null);
      }

      const accountId = results.insertId; // Récupérer l'ID du compte créé

      // 2️⃣ Insérer l'utilisateur dans la table users avec l'ID du compte
      const userQuery =
        "INSERT INTO users (account_id, username, gender, is_driver) VALUES (?, ?, ?, ?)";

      connection.query(
        userQuery,
        [accountId, username, gender, is_driver],
        (err, results) => {
          if (err) {
            return callback(err, null);
          }
          callback(null, accountId); // Retourner l'ID du compte
        }
      );
    });
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

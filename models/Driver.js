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
  static createDriver(connection, user_id, callback) {
    // Vérifier si l'utilisateur existe déjà dans la table users
    const checkUserQuery = "SELECT * FROM users WHERE account_id = ?";
    connection.query(checkUserQuery, [user_id], (err, results) => {
      if (err) return callback(err, null);

      if (results.length === 0) {
        return callback(new Error("User does not exist"), null);
      }

      // Vérifier si l'utilisateur est déjà un conducteur
      const checkDriverQuery = "SELECT * FROM drivers WHERE user_id = ?";
      connection.query(checkDriverQuery, [user_id], (err, driverResults) => {
        if (err) return callback(err, null);

        if (driverResults.length > 0) {
          return callback(new Error("User is already a driver"), null);
        }

        // Insérer dans la table drivers
        const driverQuery = "INSERT INTO drivers (user_id) VALUES (?)";
        connection.query(driverQuery, [user_id], (err, results) => {
          if (err) return callback(err, null);
          callback(null, user_id);
        });
      });
    });
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

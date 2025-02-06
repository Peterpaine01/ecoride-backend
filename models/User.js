const Account = require("./Account");

const hashPassword = require("../utils/hashPassword");

class User extends Account {
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
    consent_data_retention
  ) {
    super(
      id,
      email,
      password,
      account_type,
      account_status,
      created_at,
      deleted_at,
      verification_token
    );
    this.username = username;
    this.photo = photo;
    this.credits = credits;
    this.gender = gender;
    this.account_status = account_status;
    this.is_driver = is_driver;
    this.consent_data_retention = consent_data_retention;
  }

  static async createUser(
    connection,
    account_id,
    username,
    gender,
    is_driver,
    consent_data_retention
  ) {
    try {
      const query =
        "INSERT INTO users (account_id, username, gender, is_driver, consent_data_retention) VALUES (?, ?, ?, ?, ?)";
      const [results] = await connection
        .promise()
        .query(query, [
          account_id,
          username,
          gender,
          is_driver,
          consent_data_retention,
        ]);

      return account_id;
    } catch (err) {
      throw err;
    }
  }

  static async getUserById(connection, account_id) {
    try {
      const [results] = await connection
        .promise()
        .query(
          "SELECT username, account_status, photo, credits, gender, is_driver FROM users WHERE account_id = ?",
          [account_id]
        );

      return results.length > 0 ? results[0] : null;
    } catch (err) {
      throw err;
    }
  }

  static async getAllUsers(connection) {
    try {
      const query = `
        SELECT 
          a.id AS account_id, 
          a.email, 
          a.account_status,
          u.username, 
          u.photo,
          u.credits,
          u.gender, 
          u.is_driver, 
          d.accept_smoking, 
          d.accept_animals
        FROM accounts a
        JOIN users u ON a.id = u.account_id
        LEFT JOIN drivers d ON u.account_id = d.user_id
        ORDER BY u.username ASC
      `;

      const [results] = await connection.promise().query(query);

      const users = await Promise.all(
        results.map(async (user) => {
          return {
            id: user.account_id,
            email: user.email,
            username: user.username,
            photo: user.photo || null,
            account_status: user.account_status,
            credits: user.credits,
            gender: user.gender,
            is_driver: Boolean(user.is_driver),
            preferences: user.is_driver
              ? {
                  accept_smoking: Boolean(user.accept_smoking),
                  accept_animals: Boolean(user.accept_animals),
                }
              : null,
          };
        })
      );
      return users;
    } catch (err) {
      throw err;
    }
  }

  static async updateUser(connection, userId, updateData) {
    try {
      const {
        username,
        gender,
        is_driver,
        email,
        password,
        accept_smoking,
        accept_animals,
        photoToUpdate,
      } = updateData;

      const hashedPassword = await hashPassword(password);

      // Mettre à jour la table "accounts"
      const updateAccountQuery = `
        UPDATE accounts 
        SET email = ?, ${hashedPassword ? ", password = ?" : ""} 
        WHERE id = ?;
    `;

      const accountParams = hashedPassword
        ? [email, hashedPassword, userId]
        : [email, userId];

      await connection.promise().query(updateAccountQuery, accountParams);

      const updateUserQuery = `
        UPDATE users 
        SET username = ?, gender = ?, is_driver = ?, photo = ?
        WHERE account_id = ?;
      `;

      await connection
        .promise()
        .query(updateUserQuery, [
          username,
          gender,
          is_driver,
          photoToUpdate,
          userId,
        ]);

      const checkDriverQuery = `SELECT * FROM drivers WHERE user_id = ?`;
      const [existingDriver] = await connection
        .promise()
        .query(checkDriverQuery, [userId]);

      if (existingDriver.length === 0) {
        console.log("Ajout d'un conducteur...");
        const insertDriverQuery = `
                INSERT INTO drivers (user_id, accept_smoking, accept_animals)
                VALUES (?, ?, ?);
            `;
        await connection
          .promise()
          .query(insertDriverQuery, [userId, accept_smoking, accept_animals]);
      } else {
        console.log("Mise à jour du conducteur...");
        const updateDriverQuery = `
                UPDATE drivers 
                SET accept_smoking = ?, accept_animals = ?
                WHERE user_id = ?;
            `;
        await connection
          .promise()
          .query(updateDriverQuery, [accept_smoking, accept_animals, userId]);
      }

      return { message: "Utilisateur mis à jour avec succès" };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = User;

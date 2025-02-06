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

  static async getUserById(connection, account_id) {
    try {
      const [results] = await connection
        .promise()
        .query(
          "SELECT username, gender, is_driver FROM users WHERE account_id = ?",
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
          u.username, 
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
      const { username, gender, is_driver, photoToUpdate } = updateData;

      const query = `
        UPDATE users 
        SET username = ?, gender = ?, is_driver = ?, photo = ?
        WHERE account_id = ?;
      `;

      const [result] = await connection
        .promise()
        .query(query, [username, gender, is_driver, photoToUpdate, userId]);

      return result;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = User;

const bcrypt = require("bcrypt");

// funtion to hash password before save to database
async function hashPassword(password) {
  const saltRounds = 10; // set hash complexity
  return await bcrypt.hash(password, saltRounds);
}

class Account {
  constructor(id, email, password, account_type) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.account_type = account_type;
  }

  static async createAccount(connection, email, password) {
    try {
      const hashedPassword = await hashPassword(password); // Hash before insertion

      const query =
        "INSERT INTO accounts (email, password, account_type) VALUES (?, ?, 'user')";
      const [results] = await connection
        .promise()
        .query(query, [email, hashedPassword]);
      console.log("account results", results);
      return results.insertId;
    } catch (err) {
      throw err;
    }
  }

  static getAccountById(connection, id, callback) {
    const query = "SELECT * FROM accounts WHERE id = ?";
    connection.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  }
}

module.exports = Account;

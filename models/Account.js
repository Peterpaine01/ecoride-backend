require("dotenv").config();

const db = require("../config/mysql");

class Account {
  constructor(
    id,
    email,
    password,
    account_type,
    account_status,
    created_at,
    deleted_at,
    verification_token
  ) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.account_type = account_type;
    this.account_status = account_status;
    this.created_at = created_at;
    this.deleted_at = deleted_at;
    this.verification_token = verification_token;
  }

  static async createAccount(email, password) {
    try {
      const hashedPassword = await hashPassword(password); // Hash before insertion

      const verificationToken = crypto.randomBytes(32).toString("hex"); // Generate a random token

      const query =
        "INSERT INTO accounts (email, password, account_type, verification_token) VALUES (?, ?, 'user', ?)";
      const [results] = await db.query(query, [
        email,
        hashedPassword,
        verificationToken,
      ]);
      console.log("account results", results);

      // Send email with verification link
      await Account.sendVerificationEmail(email, verificationToken);

      return results.insertId;
    } catch (err) {
      console.error("Erreur lors de la création du compte :", err);
      throw err;
    }
  }
}

module.exports = Account;

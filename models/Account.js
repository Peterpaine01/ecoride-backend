const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const hashPassword = require("../utils/hashPassword");

class Account {
  constructor(id, email, password, account_type, created_at, deleted_at) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.account_type = account_type;
    this.created_at = created_at;
    this.deleted_at = deleted_at;
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
      console.error("Erreur lors de la création du compte :", err);
      throw err;
    }
  }

  static async login(connection, email, password) {
    try {
      // Requête pour récupérer les informations du compte avec l'email décrypté
      const query = "SELECT * FROM accounts WHERE email = ?";
      const [results] = await connection.promise().query(query, [email]);

      if (results.length === 0) {
        throw new Error("Account not found");
      }

      const account = results[0];

      // Vérification du mot de passe
      const isMatch = await bcrypt.compare(password, account.password);
      if (!isMatch) {
        throw new Error("Incorrect password");
      }

      // Création du token JWT
      const token = jwt.sign(
        { id: account.id, email: account.email },
        process.env.JWT_KEY
      );

      // Retourner le token et l'ID utilisateur
      return { token, userId: account.id };
    } catch (err) {
      console.error("Erreur lors de la tentative de connexion:", err);
      throw err;
    }
  }

  static async getAccountById(connection, id) {
    try {
      const [results] = await connection
        .promise()
        .query("SELECT id, email FROM accounts WHERE id = ?", [id]);

      if (results.length === 0) return null;

      const account = results[0];
      return account;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Account;

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const mailgunTransport = require("nodemailer-mailgun-transport");
require("dotenv").config();

const hashPassword = require("../utils/hashPassword");

const createTestAccount = async () => {
  let testAccount = await nodemailer.createTestAccount();
  console.log("Ethereal account credentials:", testAccount);
};

createTestAccount();

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

  static async createAccount(connection, email, password) {
    try {
      const hashedPassword = await hashPassword(password); // Hash before insertion

      const verificationToken = crypto.randomBytes(32).toString("hex"); // Générer un token aléatoire

      const query =
        "INSERT INTO accounts (email, password, account_type, verification_token) VALUES (?, ?, 'user', ?)";
      const [results] = await connection
        .promise()
        .query(query, [email, hashedPassword, verificationToken]);
      console.log("account results", results);

      // Envoyer un email avec le lien de vérification
      await Account.sendVerificationEmail(email, verificationToken);

      return results.insertId;
    } catch (err) {
      console.error("Erreur lors de la création du compte :", err);
      throw err;
    }
  }

  static async sendVerificationEmail(email, token) {
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // false pour TLS
      auth: {
        user: "burley.bode10@ethereal.email", // Remplace par ton user Ethereal
        pass: "uKPZ5DjVXVgUXAAeEb", // Remplace par ton pass Ethereal
      },
    });

    const verificationUrl = `${process.env.BACK_URL}/user/verify/${token}`;

    const mailOptions = {
      from: '"Test App" <no-reply@test.com>',
      to: email,
      subject: "Vérification de votre compte",
      html: `
      <h1>Bienvenue sur Ecoride !</h1>
      <p>Votre compte a bien été créé et <strong>20 crédits</strong> vous ont été attribué automatiquement. Vous pouvez désormais les utiliser pour voyager à travers toute la France !</p>
        <p>Avant de commencer à les utiliser, cliquez sur le lien pour activer votre compte :</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email envoyé à " + email);
    } catch (error) {
      console.error("Erreur d'envoi d'email :", error);
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

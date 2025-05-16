const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
require("dotenv").config()

const db = require("../config/mysql")

const hashPassword = require("../utils/hashPassword")
const sendNotificationEmail = require("../utils/sendNotificationEmail")

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
    this.id = id
    this.email = email
    this.password = password
    this.account_type = account_type
    this.account_status = account_status
    this.created_at = created_at
    this.deleted_at = deleted_at
    this.verification_token = verification_token
  }

  static async createAccount(email, password, account_type) {
    try {
      const hashedPassword = await hashPassword(password) // Hash before insertion

      const verificationToken = crypto.randomBytes(32).toString("hex") // Generate a random token

      const query =
        "INSERT INTO accounts (email, password, account_type, verification_token) VALUES (?, ?, ?, ?)"
      const [results] = await db.query(query, [
        email,
        hashedPassword,
        account_type,
        verificationToken,
      ])
      // console.log("account results", results)

      // Send email with verification link
      // await Account.sendVerificationEmail(email, verificationToken)

      return results.insertId
    } catch (error) {
      console.error("Error while creating account:" + error)
      throw error
    }
  }

  static async sendVerificationEmail(email, token) {
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // false for TLS
      auth: {
        user: "burley.bode10@ethereal.email", // user Ethereal
        pass: "uKPZ5DjVXVgUXAAeEb", // pass Ethereal
      },
    })

    const verificationUrl = `${process.env.BACK_URL}:${process.env.PORT}/user/verify/${token}`
    const redirectUrl = `${process.env.FRONT_URL}/valider-mon-compte/${token}`

    const mailOptions = {
      from: '"Ecoride" <hello@ecoride.com>',
      to: email,
      subject: "Vérification de votre compte",
      html: `
      <h1>Bienvenue sur Ecoride !</h1>
      <p>Votre compte a bien été créé et <strong>20 crédits</strong> vous ont été attribué automatiquement. Vous pouvez désormais les utiliser pour voyager à travers toute la France !</p>
        <p>Avant de commencer à les utiliser, cliquez sur le lien pour activer votre compte :</p>
        <a href="${redirectUrl}">Activer mon compte</a>
      `,
    }

    try {
      await transporter.sendMail(mailOptions)("Email send to " + email)
    } catch (error) {
      console.error("Error while sending email:" + error)
    }
  }

  static async login(email, password) {
    try {
      const query = "SELECT * FROM accounts WHERE email = ?"
      const [results] = await db.query(query, [email])

      if (results.length === 0) {
        throw new Error("Account not found")
      }

      const account = results[0]

      const isMatch = await bcrypt.compare(password, account.password)
      if (!isMatch) {
        throw new Error("Incorrect password")
      }

      const payload = {
        id: account.id,
        account_type: account.account_type, // 'user' ou 'webmaster'
      }

      const token = jwt.sign(payload, process.env.JWT_KEY, {
        expiresIn: "365d",
      })

      let role_label = null

      if (account.account_type === "webmaster") {
        const [roleResults] = await db.query(
          `
        SELECT s.account_id, a.email, r.label AS role_label
        FROM staff_members s
        JOIN accounts a ON s.account_id = a.id
        JOIN roles r ON s.role_id = r.id
        WHERE s.account_id = ?
        `,
          [account.id]
        )

        if (roleResults.length > 0) {
          role_label = roleResults[0].role_label
        }
      }

      return {
        token,
        userId: account.id,
        // roleLabel: role_label,
      }
    } catch (err) {
      console.error("Error while trying to connect:", err)
      throw err
    }
  }

  static async getAccountById(id) {
    try {
      const [results] = await db.query(
        "SELECT id, email, account_status FROM accounts WHERE id = ?",
        [id]
      )

      if (results.length === 0) return null

      const account = results[0]
      return account
    } catch (error) {
      throw error
    }
  }
}

module.exports = Account

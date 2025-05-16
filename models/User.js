const Account = require("./Account")

const hashPassword = require("../utils/hashPassword")

const db = require("../config/mysql")

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
    )
    this.username = username
    this.photo = photo
    this.credits = credits
    this.gender = gender
    this.account_status = account_status
    this.is_driver = is_driver
    this.consent_data_retention = consent_data_retention
  }

  static async createUser(
    account_id,
    username,
    gender,
    is_driver,
    consent_data_retention
  ) {
    try {
      let photo =
        "https://res.cloudinary.com/djxejhaxr/image/upload/ecoride/users/user-other_wwxni3.jpg" // Default

      if (gender === "male") {
        photo =
          "https://res.cloudinary.com/djxejhaxr/image/upload/ecoride/users/user-male_ielniw.jpg"
      } else if (gender === "female") {
        photo =
          "https://res.cloudinary.com/djxejhaxr/image/upload/ecoride/users/user-female_q2uekw.jpg"
      }

      const query =
        "INSERT INTO users (account_id, username, gender, is_driver, consent_data_retention, photo) VALUES (?, ?, ?, ?, ?, ?)"
      const [results] = await db.query(query, [
        account_id,
        username,
        gender,
        is_driver,
        consent_data_retention,
        photo,
      ])

      return account_id
    } catch (error) {
      throw error
    }
  }

  static async getUserById(account_id) {
    try {
      const [results] = await db.query(
        `
      SELECT 
        u.account_id, 
        u.username, 
        u.photo, 
        u.credits, 
        u.gender, 
        u.is_driver,
        a.account_type,

        CASE
          WHEN r.label = 'administrator' THEN 'admin'
          WHEN sm.account_id IS NOT NULL THEN 'webmaster'
          ELSE 'user'
        END AS role_label

      FROM users u
      JOIN accounts a ON u.account_id = a.id
      LEFT JOIN staff_members sm ON sm.account_id = a.id
      LEFT JOIN roles r ON r.id = sm.role_id

      WHERE u.account_id = ?
      `,
        [account_id]
      )

      return results.length > 0 ? results[0] : null
    } catch (error) {
      throw error
    }
  }

  static async getAllUsers() {
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
      `

      const [results] = await db.query(query)

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
          }
        })
      )
      return users
    } catch (error) {
      throw error
    }
  }

  static async updateUser(userId, updateData) {
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
        account_status,
      } = updateData

      // MAJ accounts
      const accountFields = []
      const accountValues = []

      if (email) {
        accountFields.push("email = ?")
        accountValues.push(email)
      }

      if (password) {
        const hashedPassword = await hashPassword(password)
        accountFields.push("password = ?")
        accountValues.push(hashedPassword)
      }

      if (account_status) {
        accountFields.push("account_status = ?")
        accountValues.push(account_status)
      }

      if (accountFields.length > 0) {
        const updateAccountQuery = `
          UPDATE accounts 
          SET ${accountFields.join(", ")}
          WHERE id = ?;
        `
        accountValues.push(userId)
        await db.query(updateAccountQuery, accountValues)
      }

      // MAJ users
      const userFields = []
      const userValues = []

      if (username) {
        userFields.push("username = ?")
        userValues.push(username)
      }

      if (gender) {
        userFields.push("gender = ?")
        userValues.push(gender)
      }

      if (typeof is_driver !== "undefined") {
        userFields.push("is_driver = ?")
        userValues.push(is_driver)
      }

      if (photoToUpdate) {
        userFields.push("photo = ?")
        userValues.push(photoToUpdate)
      }

      if (userFields.length > 0) {
        const updateUserQuery = `
          UPDATE users 
          SET ${userFields.join(", ")}
          WHERE account_id = ?;
        `
        userValues.push(userId)
        await db.query(updateUserQuery, userValues)
      }

      // MAJ drivers si is_driver
      const [existingDriver] = await db.query(
        `SELECT user_id FROM drivers WHERE user_id = ?`,
        [userId]
      )

      const safeAcceptSmoking = parseInt(accept_smoking) === 1 ? 1 : 0
      const safeAcceptAnimals = parseInt(accept_animals) === 1 ? 1 : 0

      if (is_driver && existingDriver.length === 0) {
        // Créer un nouveau driver
        await db.query(
          `INSERT INTO drivers (user_id, accept_smoking, accept_animals)
          VALUES (?, ?, ?)`,
          [userId, safeAcceptSmoking, safeAcceptAnimals]
        )
      } else if (existingDriver.length > 0) {
        // Mettre à jour le driver existant
        await db.query(
          `UPDATE drivers
          SET accept_smoking = ?, accept_animals = ?
          WHERE user_id = ?`,
          [safeAcceptSmoking, safeAcceptAnimals, userId]
        )
      }

      return { message: "User updated successfully" }
    } catch (error) {
      throw error
    }
  }

  static async softDeleteUserById(userId) {
    const anonymizedEmail = `deleted_${Date.now()}@anonymized.com`
    const photo =
      "https://res.cloudinary.com/djxejhaxr/image/upload/ecoride/users/user-other_wwxni3.jpg"

    const updateUserQuery = `
      UPDATE users
      SET 
        username = 'Utilisateur supprimé',
        photo = ?
      WHERE account_id = ?
    `
    await db.query(updateUserQuery, [photo, userId])

    const updateAccountQuery = `
      UPDATE accounts
      SET 
        email = ?,
        account_status = 'deleted',
        deleted_at = NOW()
      WHERE id = ?
    `
    await db.query(updateAccountQuery, [anonymizedEmail, userId])
  }

  static async hardDeleteUserById(userId) {
    console.log("hardDeleteUserById")
    await db.execute(`DELETE FROM drivers WHERE user_id = ?`, [userId])
    await db.execute(`DELETE FROM users WHERE account_id = ?`, [userId])
    await db.execute(`DELETE FROM accounts WHERE id = ?`, [userId])
  }
}

module.exports = User

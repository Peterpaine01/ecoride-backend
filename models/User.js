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
          r.label AS role_label
        FROM users u
        JOIN accounts a ON u.account_id = a.id
        LEFT JOIN staff_members sm ON sm.account_id = a.id AND a.account_type = 'webmaster'
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
      } = updateData

      const hashedPassword = await hashPassword(password)

      // Update accounts table (SQL)
      const updateAccountQuery = `
        UPDATE accounts 
        SET email = ?${hashedPassword ? ", password = ?" : ""} 
        WHERE id = ?;
    `

      const accountParams = hashedPassword
        ? [email, hashedPassword, userId]
        : [email, userId]

      await db.query(updateAccountQuery, accountParams)

      // Update users table (SQL)
      const updateUserQuery = `
        UPDATE users 
        SET username = ?, gender = ?, is_driver = ?, photo = ?
        WHERE account_id = ?;
      `

      await db.query(updateUserQuery, [
        username,
        gender,
        is_driver,
        photoToUpdate,
        userId,
      ])

      // Insert or update drivers table (SQL)
      const checkDriverQuery = `SELECT * FROM drivers WHERE user_id = ?`
      const [existingDriver] = await db.query(checkDriverQuery, [userId])

      // Check if driver already exist
      if (existingDriver.length === 0) {
        // if driver doesn't exist in drivers table, insert
        const insertDriverQuery = `
                INSERT INTO drivers (user_id, accept_smoking, accept_animals)
                VALUES (?, ?, ?);
            `
        await db.query(insertDriverQuery, [
          userId,
          accept_smoking,
          accept_animals,
        ])
      } else {
        // if driver already exists in drivers table, update
        const updateDriverQuery = `
                UPDATE drivers 
                SET accept_smoking = ?, accept_animals = ?
                WHERE user_id = ?;
            `
        await db.query(updateDriverQuery, [
          accept_smoking,
          accept_animals,
          userId,
        ])
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
        email = ?,
        username = 'Utilisateur supprimé',
        photo = ?
      WHERE id = ?
    `
    await db.query(updateUserQuery, [anonymizedEmail, photo, userId])

    const updateAccountQuery = `
      UPDATE accounts
      SET 
        account_status = 'deleted',
        deleted_at = NOW()
      WHERE id = ?
    `
    await db.query(updateAccountQuery, [userId])
  }

  static async hardDeleteUserById(userId) {
    await db.execute(`DELETE FROM drivers WHERE user_id = ?`, [userId])
    await db.execute(`DELETE FROM users WHERE id = ?`, [userId])
    await db.execute(`DELETE FROM accounts WHERE id = ?`, [userId])
  }
}

module.exports = User

const Account = require("./Account")

const hashPassword = require("../utils/hashPassword")

const db = require("../config/mysql")

class StaffMembers extends Account {
  constructor(
    id,
    email,
    password,
    account_type = "webmaster",
    account_status,
    created_at,
    deleted_at,
    verification_token,
    firstname,
    lastname,
    roleId
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
    this.firstname = firstname
    this.lastname = lastname
    this.roleId = roleId
  }

  static async createStaffMembers(account_id, firstname, lastname, roleId) {
    try {
      const query =
        "INSERT INTO staff_members (account_id, first_name, last_name, role_id) VALUES (?, ?, ?, ?)"
      const [results] = await db.query(query, [
        account_id,
        firstname,
        lastname,
        roleId,
      ])

      return results[0]
    } catch (error) {
      throw error
    }
  }

  static async getStaffById(account_id) {
    try {
      const query = `
        SELECT 
          a.id AS account_id, 
          a.email, 
          a.account_status,
          sm.first_name, 
          sm.last_name,
          r.label AS role,
          r.id AS role_id,
          a.account_status,
          a.account_type
        FROM accounts a
        JOIN staff_members sm ON a.id = sm.account_id
        LEFT JOIN roles r ON sm.role_id = r.id
        WHERE a.id = ?
      `
      const [results] = await db.query(query, [account_id])

      return results.length > 0 ? results[0] : null
    } catch (error) {
      throw error
    }
  }

  static async getAllStaffMembers() {
    try {
      const query = `
        SELECT 
          sm.account_id, 
          a.email, 
          a.account_status,
          sm.first_name, 
          sm.last_name,
          r.label AS role
        FROM staff_members sm
        LEFT JOIN accounts a ON a.id = sm.account_id
        LEFT JOIN roles r ON sm.role_id = r.id
        ORDER BY sm.last_name ASC, sm.first_name ASC;
      `

      const [results] = await db.query(query)

      return results
    } catch (error) {
      throw error
    }
  }

  static async updateStaffMembers(userId, updateData) {
    try {
      const {
        firstname,
        lastname,
        email,
        password,
        accountType,
        accountStatus,
        roleId,
      } = updateData

      let hashedPassword = null
      if (password && password.trim() !== "") {
        hashedPassword = await hashPassword(password)
      }

      // Update accounts table (SQL)
      const updateAccountQuery = `
        UPDATE accounts 
        SET email = ?, account_type = ?, account_status = ?
        ${hashedPassword ? ", password = ?" : ""}
        WHERE id = ?
      `

      const accountParams = hashedPassword
        ? [email, accountType, accountStatus, hashedPassword, userId]
        : [email, accountType, accountStatus, userId]

      await db.query(updateAccountQuery, accountParams)

      // Update staff_members table (SQL)
      const updateStaffQuery = `
        UPDATE staff_members 
        SET first_name = ?, last_name = ?, role_id = ?
        WHERE account_id = ?
      `
      await db.query(updateStaffQuery, [firstname, lastname, roleId, userId])

      return { message: "StaffMember updated successfully" }
    } catch (error) {
      throw error
    }
  }

  static async deleteStaffMember(accountId) {
    try {
      await db.query("DELETE FROM staff_members WHERE account_id = ?", [
        accountId,
      ])

      const [result] = await db.query("DELETE FROM accounts WHERE id = ?", [
        accountId,
      ])

      if (result.affectedRows === 0) {
        throw new Error("No account found with this ID.")
      }

      return { message: "StaffMember deleted successfully." }
    } catch (error) {
      throw error
    }
  }
}

module.exports = StaffMembers

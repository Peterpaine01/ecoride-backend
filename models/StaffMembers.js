const Account = require("./Account");

const hashPassword = require("../utils/hashPassword");

const db = require("../config/mysql");

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
    );
    this.firstname = firstname;
    this.lastname = lastname;
    this.roleId = roleId;
  }

  static async createStaffMembers(account_id, firstname, lastname, roleId) {
    try {
      const query =
        "INSERT INTO staff_members (account_id, firstname, lastname, roleId) VALUES (?, ?, ?, ?)";
      const [results] = await db.query(query, [
        account_id,
        firstname,
        lastname,
        roleId,
      ]);

      return results[0];
    } catch (error) {
      throw error;
    }
  }

  static async getStaffById(account_id) {
    try {
      const query = `
        SELECT 
          a.id AS account_id, 
          a.email, 
          a.account_status,
          s.firstname, 
          s.lastname,
          r.label AS role
        FROM accounts a
        JOIN staff_members s ON a.id = s.account_id
        LEFT JOIN roles r ON s.role_id = r.id
        WHERE a.id = ?
      `;
      const [results] = await db.query(query, [account_id]);

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAllStaffMembers() {
    try {
      const query = `
        SELECT 
          a.id AS account_id, 
          a.email, 
          a.account_status,
          s.firstname, 
          s.lasttname,
          r.label AS role
        FROM accounts a
        JOIN staff_members s ON a.id = s.account_id
        LEFT JOIN roles r ON s.role_id = r.id
        ORDER BY s.lastname ASC,  s.firstname ASC
      `;

      const [results] = await db.query(query);

      return results;
    } catch (error) {
      throw error;
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
      } = updateData;

      const hashedPassword = await hashPassword(password);

      // Update accounts table (SQL)
      const updateAccountQuery = `
        UPDATE accounts 
        SET email = ?, account_type = ?, account_status = ?
        ${hashedPassword ? ", password = ?" : ""}
        WHERE id = ?
    `;

      const accountParams = hashedPassword
        ? [email, accountType, accountStatus, hashedPassword, userId]
        : [email, accountType, accountStatus, userId];

      await db.query(updateAccountQuery, accountParams);

      // Update staff_members table (SQL)
      const updateStaffQuery = `
        UPDATE staff_members 
        SET firstname = ?, lastname = ?, role_id = ?
        WHERE account_id = ?
      `;
      await db.query(updateStaffQuery, [firstname, lastname, roleId, userId]);

      return { message: "StaffMember updated successfully" };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StaffMembers;

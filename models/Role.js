const db = require("../config/mysql")

class Role {
  constructor(id, label) {
    this.id = id
    this.label = label
  }

  static async getAllRoles() {
    const [results] = await db.query("SELECT * FROM roles ORDER BY label ASC")
    return results
  }

  static async getRoleById(id) {
    const [results] = await db.query("SELECT * FROM roles WHERE id = ?", [id])
    return results.length > 0 ? results[0] : null
  }

  static async createRole(label) {
    const [result] = await db.query("INSERT INTO roles (label) VALUES (?)", [
      label,
    ])
    return { id: result.insertId, label }
  }

  static async updateRole(id, label) {
    await db.query("UPDATE roles SET label = ? WHERE id = ?", [label, id])
    return { id, label }
  }

  static async deleteRole(id) {
    await db.query("DELETE FROM roles WHERE id = ?", [id])
    return { message: "Role deleted successfully" }
  }
}

module.exports = Role

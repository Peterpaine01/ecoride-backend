const db = require("../config/mysql")

class Brand {
  constructor({ id, label }) {
    this.id = id
    this.label = label
  }

  static async getBrands() {
    try {
      const [rows] = await db.query("SELECT * FROM brands")
      return rows
    } catch (error) {
      throw error
    }
  }
}

module.exports = Brand

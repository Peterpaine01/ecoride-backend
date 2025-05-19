const db = require("../config/mysql")

class Energy {
  constructor({
    id,
    registration_number,
    first_registration_date,
    model,
    color,
    energy_id,
    brand_id,
    available_seats,
    driver_id,
  }) {
    this.id = id
    this.registration_number = registration_number
    this.first_registration_date = first_registration_date
    this.model = model
    this.color = color
    this.energy_id = energy_id
    this.brand_id = brand_id
    this.available_seats = available_seats
    this.driver_id = driver_id
  }

  static async getEnergies() {
    try {
      const [rows] = await db.query("SELECT * FROM energies")
      return rows
    } catch (error) {
      throw error
    }
  }
}

module.exports = Energy

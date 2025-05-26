const db = require("../config/mysql")

class Car {
  constructor(
    id,
    registration_number,
    first_registration_date,
    model,
    color,
    energy_id,
    brand_id,
    available_seats,
    driver_id
  ) {
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

  static async createCar({
    registration_number,
    first_registration_date,
    model,
    color,
    energy_id,
    brand_id,
    available_seats,
    driver_id,
  }) {
    try {
      const checkQuery = `
      SELECT id FROM cars 
      WHERE registration_number = ? AND driver_id = ?
      LIMIT 1;
    `
      const [existing] = await db.query(checkQuery, [
        registration_number,
        driver_id,
      ])

      if (existing.length > 0) {
        throw new Error("Register number is aleady used.")
      }

      const insertQuery = `
      INSERT INTO cars (
        registration_number, 
        first_registration_date, 
        model, 
        color, 
        energy_id, 
        brand_id, 
        available_seats, 
        driver_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `
      const [result] = await db.query(insertQuery, [
        registration_number,
        first_registration_date,
        model,
        color,
        energy_id,
        brand_id,
        available_seats,
        driver_id,
      ])

      return result.insertId
    } catch (error) {
      throw error
    }
  }

  static async getCarById(carId) {
    try {
      const query = `
        SELECT 
          cars.id, 
          cars.registration_number, 
          cars.first_registration_date, 
          cars.model, 
          cars.color, 
          cars.available_seats, 
          brands.label AS brand, 
          energies.id AS energy_id,
          energies.label AS energy,
          cars.driver_id
        FROM cars
        JOIN brands ON cars.brand_id = brands.id
        JOIN energies ON cars.energy_id = energies.id
        WHERE cars.id = ?;
      `

      const [rows] = await db.query(query, [carId])
      if (rows.length === 0) {
        return null
      }
      return rows[0]
    } catch (error) {
      throw new Error(error.message)
    }
  }

  static async getCarsByDriver(driverId) {
    try {
      const query = `
      SELECT 
        cars.id, 
        cars.registration_number, 
        cars.first_registration_date, 
        cars.model, 
        cars.color, 
        cars.available_seats, 
        brands.label AS brand, 
        energies.id AS energy_id,
        energies.label AS energy
      FROM cars
      JOIN brands ON cars.brand_id = brands.id
      JOIN energies ON cars.energy_id = energies.id
      WHERE cars.driver_id = ?;
    `

      const [rows] = await db.query(query, [driverId])
      return Array.isArray(rows) ? rows : []
    } catch (error) {
      console.error("Erreur dans getCarsByDriver:", error)
      return []
    }
  }

  static async updateCar(
    carId,
    {
      registration_number,
      first_registration_date,
      model,
      color,
      energy_id,
      brand_id,
      available_seats,
    }
  ) {
    try {
      const query = `
        UPDATE cars 
        SET registration_number = ?, first_registration_date = ?, model = ?, color = ?, energy_id = ?, brand_id = ?, available_seats = ?
        WHERE id = ?;
      `
      const [result] = await db.query(query, [
        registration_number,
        first_registration_date,
        model,
        color,
        energy_id,
        brand_id,
        available_seats,
        carId,
      ])
      return result.affectedRows > 0
    } catch (error) {
      throw new Error(error.message)
    }
  }

  static async deleteCar(carId) {
    try {
      const query = `DELETE FROM cars WHERE id = ?;`
      const [result] = await db.query(query, [carId])
      return result.affectedRows > 0
    } catch (error) {
      throw new Error(error.message)
    }
  }
}

module.exports = Car

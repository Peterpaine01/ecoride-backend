const db = require("../config/mysql");

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
    this.id = id;
    this.registration_number = registration_number;
    this.first_registration_date = first_registration_date;
    this.model = model;
    this.color = color;
    this.energy_id = energy_id;
    this.brand_id = brand_id;
    this.available_seats = available_seats;
    this.driver_id = driver_id;
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
    console.log(brand_id);

    try {
      const query = `
        INSERT INTO cars (registration_number, first_registration_date, model, color, energy_id, brand_id, available_seats, driver_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;
      const [result] = await db.query(query, [
        registration_number,
        first_registration_date,
        model,
        color,
        energy_id,
        brand_id,
        available_seats,
        driver_id,
      ]);

      console.log(result);

      return result.insertId; // Return car id
    } catch (error) {
      throw new Error(error.message);
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
          energies.label AS energy,
          cars.driver_id
        FROM cars
        JOIN brands ON cars.brand_id = brands.id
        JOIN energies ON cars.energy_id = energies.id
        WHERE cars.id = ?;
      `;

      const [rows] = await db.query(query, [carId]);
      if (rows.length === 0) {
        return null; // No car found
      }
      return rows[0]; // Return car found
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async getCarsByDriver(driverId) {
    try {
      console.log(driverId);

      const query = `
          SELECT 
          cars.id, 
          cars.registration_number, 
          cars.first_registration_date, 
          cars.model, 
          cars.color, 
          cars.available_seats, 
          brands.label AS brand, 
          energies.label AS energy
        FROM cars
        JOIN brands ON cars.brand_id = brands.id
        JOIN energies ON cars.energy_id = energies.id
        WHERE cars.driver_id = ?;
      `;

      const [rows] = await db.query(query, [driverId]);
      return rows; // Return cars list
    } catch (error) {
      throw new Error(error.message);
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
      `;
      const [result] = await db.query(query, [
        registration_number,
        first_registration_date,
        model,
        color,
        energy_id,
        brand_id,
        available_seats,
        carId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async deleteCar(carId) {
    try {
      const query = `DELETE FROM cars WHERE id = ?;`;
      const [result] = await db.query(query, [carId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = Car;

const db = require("../config/mysql");
const mongoose = require("../config/mongodb");
const { Ride } = require("../models/Ride");

async function updateDailyStatistics() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const totalRides = await Ride.countDocuments({
      createdAt: {
        $gte: new Date(today + "T00:00:00.000Z"),
        $lt: new Date(today + "T23:59:59.999Z"),
      },
    });

    const dailyBenefits = totalRides * 2;

    await db.query(
      `INSERT INTO statistiques (day, total_rides, daily_benefits)
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         total_rides = VALUES(total_rides), 
         daily_benefits = VALUES(daily_benefits)`,
      [today, totalRides, dailyBenefits]
    );

    console.log(
      `Statistics updated : ${totalRides} rides, ${dailyBenefits}crédits de bénéfices`
    );
  } catch (error) {
    console.error("Error updating statistiques :", error);
  }
}

module.exports = { updateDailyStatistics };

const db = require("../config/mysql")
const { Ride } = require("../models/Ride")
const { Booking } = require("../models/Booking")

async function updateDailyStatistics() {
  try {
    const today = new Date().toISOString().split("T")[0]

    // Récupérer les rides complétés du jour
    const completedRides = await Ride.find({
      rideStatus: "completed",
      createdAt: {
        $gte: new Date(`${today}T00:00:00.000Z`),
        $lt: new Date(`${today}T23:59:59.999Z`),
      },
    })

    const totalRides = completedRides.length
    let totalSeats = 0

    for (const ride of completedRides) {
      const bookings = await Booking.find({ rideId: ride._id })

      for (const booking of bookings) {
        const seatCount = booking.bookingDetails?.seat || 0
        totalSeats += seatCount
      }
    }

    const dailyBenefits = totalSeats * 2

    await db.query(
      `INSERT INTO statistiques (day, total_rides, daily_benefits)
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         total_rides = VALUES(total_rides), 
         daily_benefits = VALUES(daily_benefits)`,
      [today, totalRides, dailyBenefits]
    )

    console.log(
      `Statistiques mises à jour : ${totalRides} trajets, ${totalSeats} sièges réservés, ${dailyBenefits} crédits de bénéfices`
    )
  } catch (error) {
    console.error("Error updating statistiques :", error)
  }
}

module.exports = { updateDailyStatistics }

const { updateDailyStatistics } = require("../services/statisticsService")
const db = require("../config/mysql")

const {
  startOfISOWeek,
  endOfISOWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  addWeeks,
} = require("date-fns")

async function updateStatisticsManually(req, res) {
  try {
    await updateDailyStatistics()
    res.status(200).json({ message: "Statistics updated successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function getTotalBenefits(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT SUM(daily_benefits) AS total_benefits FROM statistiques`
    )
    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function getDetailedStatisticsByPeriod(req, res) {
  try {
    const { period, value } = req.query
    let startDate, endDate

    if (period === "daily") {
      startDate = new Date(value)
      endDate = new Date(value)
    } else if (period === "weekly") {
      const [year, week] = value.split("-").map(Number)

      const jan4 = new Date(year, 0, 4)
      const firstWeekStart = startOfISOWeek(jan4)
      startDate = addWeeks(firstWeekStart, week - 1)
      endDate = endOfISOWeek(startDate)
    } else if (period === "monthly") {
      startDate = startOfMonth(parseISO(value))
      endDate = endOfMonth(startDate)
    } else if (period === "yearly") {
      startDate = startOfYear(parseISO(value))
      endDate = endOfYear(startDate)
    } else {
      return res.status(400).json({ error: "Invalid period" })
    }

    const [rows] = await db.query(
      `
      SELECT day, daily_benefits, total_rides
      FROM statistiques
      WHERE day BETWEEN ? AND ?
      ORDER BY day ASC
    `,
      [
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      ]
    )

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No data found for the selected period" })
    }

    res.json(rows)
  } catch (error) {
    console.error("Error fetching statistics:", error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  updateStatisticsManually,
  getTotalBenefits,
  getDetailedStatisticsByPeriod,
}

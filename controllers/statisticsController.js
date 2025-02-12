const { updateDailyStatistics } = require("../services/statisticsService");

async function updateStatisticsManually(req, res) {
  try {
    await updateDailyStatistics();
    res.status(200).json({ message: "Statistics updating successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { updateStatisticsManually };

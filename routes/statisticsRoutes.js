const express = require("express")
const router = express.Router()
const statisticsController = require("../controllers/statisticsController")

router.post("/statistics/update", statisticsController.updateStatisticsManually)
router.get("/statistics/total", statisticsController.getTotalBenefits)
router.get(
  "/statistics/details",
  statisticsController.getDetailedStatisticsByPeriod
)

module.exports = router

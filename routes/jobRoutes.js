const express = require("express");

const auctionController = require("../controllers/auctionController");
const jobController = require("../controllers/jobController");
const adminController = require("../controllers/adminController");
const router = express.Router();

router.route("/").post(adminController.requireAuth, jobController.invokeJob);
router.route("/latest").get(adminController.requireAuth, jobController.getLatestJob);
router
  .route("/performance-snapshots")
  .get(adminController.requireAuth, jobController.getPerformanceSnapshots);
// router.route("/").post(auctionController.fetchGSAAuctions);

module.exports = router;

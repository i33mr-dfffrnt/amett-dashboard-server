const express = require("express");

const bidController = require("../controllers/bidController");
const imageController = require("../controllers/imageController");
const adminController = require("../controllers/adminController");
const router = express.Router();

router
  .route("/")
  .get(bidController.getAllBids)
  .post(bidController.createBid)
  .delete(adminController.requireAuth, bidController.deleteMultiBid);
router
  .route("/:bidId")
  .get(bidController.getBid)
  .delete(adminController.requireAuth, bidController.deleteBid);

// router.route("/").get(jobController.invokeJob);

module.exports = router;

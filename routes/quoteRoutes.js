const express = require("express");

const quoteController = require("../controllers/quoteController");
const imageController = require("../controllers/imageController");
const router = express.Router();
const adminController = require("../controllers/adminController");

router
  .route("/")
  .get(quoteController.getAllQuotes)
  .post(quoteController.createQuote)
  .delete(adminController.requireAuth, quoteController.deleteMultiQuote);
router
  .route("/:bidId")
  .get(quoteController.getQuote)
  .delete(adminController.requireAuth, quoteController.deleteQuote);

// router.route("/").get(jobController.invokeJob);

module.exports = router;

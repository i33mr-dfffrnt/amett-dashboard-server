const express = require("express");

const serviceController = require("../controllers/serviceController");
const router = express.Router();

router.route("/").post(serviceController.createService);
router
  .route("/:serviceId")
  .get(serviceController.getServiceRequest)
  .patch(serviceController.acceptService);

// router.route("/status/:serviceId").get(quoteController.getQuote);

module.exports = router;

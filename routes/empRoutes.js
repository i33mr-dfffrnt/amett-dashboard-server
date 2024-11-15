const express = require("express");

const empController = require("../controllers/empController");
const router = express.Router();

router.route("/").get(empController.getAllEmps);

// router.route("/status/:serviceId").get(quoteController.getQuote);

module.exports = router;

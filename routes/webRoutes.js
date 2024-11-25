const express = require("express");
const webController = require("../controllers/webController");

const router = express.Router();

router.route("/menu").get(webController.getMenu);

router.route("/featured-equipment").get(webController.getFeaturedEquipmentModels);

router.route("/featured-service").get(webController.getFeaturedServices);
module.exports = router;

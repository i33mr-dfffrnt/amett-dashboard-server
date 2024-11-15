const express = require("express");

const adminController = require("../controllers/adminController");
const router = express.Router();

// router.route("/reg").post(adminController.temp);
router.route("/login").post(adminController.login);
router.route("/logout").post(adminController.requireAuth, adminController.logout);
router.route("/checkAuth").get(adminController.checkRouteAuth);

module.exports = router;

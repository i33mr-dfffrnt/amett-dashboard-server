const express = require("express");
const serviceTypeController = require("../controllers/serviceTypeController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router
  .route("/")
  .get(serviceTypeController.getAllServiceTypes)
  .post(
    adminController.requireAuth,

    serviceTypeController.createServiceType
  )
  .delete(adminController.requireAuth, serviceTypeController.deleteMultiTypes);

router
  .route("/:serviceTypeId")
  .get(serviceTypeController.getServiceType)
  .patch(
    adminController.requireAuth,

    serviceTypeController.updateType
  )
  .delete(adminController.requireAuth, serviceTypeController.deleteServiceType);

module.exports = router;

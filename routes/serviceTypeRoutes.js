const express = require("express");
const serviceTypeController = require("../controllers/serviceTypeController");
const imageController = require("../controllers/imageController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router
  .route("/")
  .get(serviceTypeController.getAllServiceTypes)
  .post(
    // adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    // imageController.sendImageToS3Bucket,
    serviceTypeController.createServiceType
  )
  .delete(
    // adminController.requireAuth,
    serviceTypeController.deleteMultiTypes
  );

router
  .route("/:serviceTypeId")
  .get(serviceTypeController.getServiceType)
  .patch(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    imageController.sendImageToS3Bucket,
    serviceTypeController.updateType
  )
  .delete(
    // adminController.requireAuth,
    serviceTypeController.deleteServiceType
  );

module.exports = router;

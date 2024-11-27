const express = require("express");
const serviceController = require("../controllers/serviceController");
const imageController = require("../controllers/imageController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.route("/search/:searchTerm").get(serviceController.searchForServices);

router
  .route("/")
  .get(serviceController.getAllServices)
  .post(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    imageController.sendImageToS3Bucket,
    serviceController.createService
  )
  .delete(adminController.requireAuth, serviceController.deleteMultiServices);

router.get("/category/:categoryId", serviceController.getServicesBasedOnType);

router
  .route("/:serviceId")
  .get(serviceController.getService)
  .patch(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    imageController.sendImageToS3Bucket,
    serviceController.updateService
  )
  .delete(adminController.requireAuth, serviceController.deleteService);

module.exports = router;

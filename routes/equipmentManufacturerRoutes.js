const express = require("express");
const equipmentManufacturerController = require("../controllers/equipmentManufacturerController");
const imageController = require("../controllers/imageController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router
  .route("/")
  .get(equipmentManufacturerController.getAllEquipmentManufacturers)
  .post(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(0),
    imageController.sendImageToS3Bucket,
    equipmentManufacturerController.createEquipmentManufacturer
  )
  .delete(adminController.requireAuth, equipmentManufacturerController.deleteMultiManufacturers);

router
  .route("/:equipmentManufacturerId")
  .get(equipmentManufacturerController.getManufacturer)
  .patch(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(0),
    imageController.sendImageToS3Bucket,
    equipmentManufacturerController.updateManufacturer
  )
  .delete(adminController.requireAuth, equipmentManufacturerController.deleteEquipmentManufacturer);

module.exports = router;

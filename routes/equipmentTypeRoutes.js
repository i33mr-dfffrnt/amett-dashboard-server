const express = require("express");
const equipmentTypeController = require("../controllers/equipmentTypeController");
const imageController = require("../controllers/imageController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router
  .route("/")
  .get(equipmentTypeController.getAllEquipmentTypes)
  .post(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    imageController.sendImageToS3Bucket,
    equipmentTypeController.createEquipmentType
  )
  .delete(adminController.requireAuth, equipmentTypeController.deleteMultiTypes);

router
  .route("/:equipmentTypeId")
  .get(equipmentTypeController.getEquipmentType)
  .patch(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    imageController.sendImageToS3Bucket,
    equipmentTypeController.updateType
  )
  .delete(adminController.requireAuth, equipmentTypeController.deleteEquipmentType);

module.exports = router;

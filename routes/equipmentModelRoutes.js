const express = require("express");
const equipmentModelController = require("../controllers/equipmentModelController");
const imageController = require("../controllers/imageController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.route("/search/:searchTerm").get(equipmentModelController.searchForEquipmentModels);


router
  .route("/")
  .get(equipmentModelController.getAllEquipmentModels)
  .post(
    // adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    // imageController.sendImageToS3Bucket,
    equipmentModelController.createEquipmentModel
  )
  .delete(adminController.requireAuth, equipmentModelController.deleteMultiModels);

  router.get('/category/:categoryId', equipmentModelController.getEquipmentModelsBasedOnType);


router
  .route("/:equipmentModelId")
  .get(equipmentModelController.getModel)
  .patch(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    imageController.sendImageToS3Bucket,
    equipmentModelController.updateModel
  )
  .delete(adminController.requireAuth, equipmentModelController.deleteEquipmentModel);

module.exports = router;

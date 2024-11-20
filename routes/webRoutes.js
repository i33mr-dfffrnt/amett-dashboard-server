const express = require("express");
const webController = require("../controllers/webController");

const router = express.Router();

router
  .route("/menu")
  .get(webController.getMenu)

// router
//   .route("/:equipmentModelId")
//   .get(equipmentModelController.getModel)
//   .patch(
//     adminController.requireAuth,
//     imageController.uploadImage("image"),
//     imageController.resizeImage(800, 800),
//     imageController.sendImageToS3Bucket,
//     equipmentModelController.updateModel
//   )
//   .delete(adminController.requireAuth, equipmentModelController.deleteEquipmentModel);

module.exports = router;

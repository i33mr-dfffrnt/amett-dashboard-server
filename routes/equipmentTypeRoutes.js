const express = require("express");
const equipmentTypeController = require("../controllers/equipmentTypeController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router
  .route("/")
  .get(equipmentTypeController.getAllEquipmentTypes)
  .post(
    adminController.requireAuth,

    equipmentTypeController.createEquipmentType
  )
  .delete(adminController.requireAuth, equipmentTypeController.deleteMultiTypes);

router
  .route("/:equipmentTypeId")
  .get(equipmentTypeController.getEquipmentType)
  .patch(
    adminController.requireAuth,

    equipmentTypeController.updateType
  )
  .delete(adminController.requireAuth, equipmentTypeController.deleteEquipmentType);

module.exports = router;

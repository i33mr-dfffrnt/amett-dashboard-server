const express = require("express");
const adminController = require("../controllers/adminController");
const requestController = require("../controllers/requestController");
const router = express.Router();


router
  .route("/")
  .post(requestController.createRequest)
  .get(requestController.getAllRequests)
  .delete(adminController.requireAuth, requestController.deleteMultiRequests);

  router
  .route("/:requestId")
  .delete(requestController.deleteRequest);



module.exports = router;

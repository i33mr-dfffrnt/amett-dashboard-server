const express = require("express");

const auctionController = require("../controllers/auctionController");
const imageController = require("../controllers/imageController");
const adminController = require("../controllers/adminController");
const router = express.Router();

router
  .route("/")
  .get(auctionController.getAllAuctions)
  .delete(adminController.requireAuth, auctionController.deleteMultiAuction);
router
  .route("/:auctionId")
  .get(auctionController.getAuction)
  .delete(adminController.requireAuth, auctionController.deleteAuction)
  .patch(
    adminController.requireAuth,
    imageController.uploadImage("image"),
    imageController.resizeImage(800, 800),
    imageController.sendImageToS3Bucket,
    auctionController.updateAuction
  );

// router.route("/").get(jobController.invokeJob);

module.exports = router;

const mongoose = require("mongoose");
const EquipmentModel = require("./equipmentModelModel");
const Quote = require("./quoteModel");
const myS3Client = require("../utils/myS3Client");
const { DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const equipmentTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A equipmentType must have a name"],
    },
  },
  { timestamps: true }
);

equipmentTypeSchema.post("findOneAndDelete", async function (doc) {
  const equipmentModels = await EquipmentModel.find({ type: doc._id });
  const quotes = await Quote.deleteMany({ model: equipmentModels });
  await EquipmentModel.deleteMany({ type: doc._id });

  if (equipmentModels.length) {
    deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Delete: {
        Objects: imagesToDelete,
      },
    };

    await myS3Client.send(new DeleteObjectsCommand(deleteParams));
  }
});

const EquipmentType = mongoose.model("EquipmentType", equipmentTypeSchema);

module.exports = EquipmentType;

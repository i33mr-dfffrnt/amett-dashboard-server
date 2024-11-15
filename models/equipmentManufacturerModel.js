const mongoose = require("mongoose");
const EquipmentModel = require("./equipmentModelModel");
const Quote = require("./quoteModel");
const myS3Client = require("../utils/myS3Client");
const { DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const equipmentManufacturerSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A equipmentManufacturer must have a name"],
    },
    image: {
      type: String,
      required: [true, "equipmentManufacturer must have an image"],
      trim: true,
    },
  },
  { timestamps: true }
);

equipmentManufacturerSchema.post("findOneAndDelete", async function (doc) {
  const equipmentModels = await EquipmentModel.find({ manufacturer: doc._id });
  const quotes = await Quote.deleteMany({ model: equipmentModels });
  await EquipmentModel.deleteMany({ manufacturer: doc._id });

  const imagesToDelete = equipmentModels.map((option) => {
    return {
      Key: option.image,
    };
  });

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

const EquipmentManufacturer = mongoose.model("EquipmentManufacturer", equipmentManufacturerSchema);

module.exports = EquipmentManufacturer;

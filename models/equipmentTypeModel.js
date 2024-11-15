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

    // Remove this list, replace it with getting types where model.manuID = selectedManu.id.
    // listOfManufacturers: {
    //   type: [mongoose.Schema.ObjectId],
    //   ref: "EquipmentManufacturer",
    // },
    image: {
      type: String,
      required: [true, "equipmentType must have an image"],
      trim: true,
    },
  },
  { timestamps: true }
);

equipmentTypeSchema.post("findOneAndDelete", async function (doc) {
  const equipmentModels = await EquipmentModel.find({ type: doc._id });
  const quotes = await Quote.deleteMany({ model: equipmentModels });
  await EquipmentModel.deleteMany({ type: doc._id });

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

const EquipmentType = mongoose.model("EquipmentType", equipmentTypeSchema);

module.exports = EquipmentType;

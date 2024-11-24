const mongoose = require("mongoose");
const ServiceModel = require("./serviceModel");
const myS3Client = require("../utils/myS3Client");
const { DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const serviceTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A ServiceType must have a name"],
    },

    // Remove this list, replace it with getting types where model.manuID = selectedManu.id.
    // listOfManufacturers: {
    //   type: [mongoose.Schema.ObjectId],
    //   ref: "EquipmentManufacturer",
    // },
    image: {
      type: String,
      required: [true, "ServiceType must have an image"],
      trim: true,
    },
  },
  { timestamps: true }
);

serviceTypeSchema.post("findOneAndDelete", async function (doc) {
  const serviceModels = await ServiceModel.find({ type: doc._id });
  await ServiceModel.deleteMany({ type: doc._id });

  const imagesToDelete = serviceModels.map((option) => {
    return {
      Key: option.image,
    };
  });

  if (serviceModels.length) {
    deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Delete: {
        Objects: imagesToDelete,
      },
    };

    await myS3Client.send(new DeleteObjectsCommand(deleteParams));
  }
});

const ServiceType = mongoose.model("ServiceType", serviceTypeSchema);

module.exports = ServiceType;

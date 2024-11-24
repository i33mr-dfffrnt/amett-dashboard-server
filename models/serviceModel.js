const mongoose = require("mongoose");
const ServiceType = require("./serviceTypeModel");

const serviceSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A service must have a name"],
    },
    description: {
      type: String,
      required: [true, "A service must have a description"],
    },
    image: {
      type: String,
      required: [true, "service must have an image"],
      trim: true,
    },
    type: {
      type: mongoose.Schema.ObjectId,
      ref: "ServiceType",
      required: [true, "A service must have a type"],
    },

    // Add createdAt & status

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// serviceSchema.post("findOneAndDelete", async function (doc) {
//   console.log("doc", doc._id);
//   const quotes = await Quote.deleteMany({ model: doc._id });
// });

const ServiceModel = mongoose.model("ServiceModel", serviceSchema);

module.exports = ServiceModel;

const mongoose = require("mongoose");
const EquipmentType = require("./equipmentTypeModel");
const Quote = require("./quoteModel");

const equipmentModelSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A equipmentModel must have a name"],
    },
    description: {
      type: String,
      required: [true, "A equipmentModel must have a description"],
    },
    image: {
      type: String,
      required: [true, "equipmentType must have an image"],
      trim: true,
    },
    type: {
      type: mongoose.Schema.ObjectId,
      ref: "EquipmentType",
      required: [true, "A equipmentModel must have a type"],
    },
    manufacturer: {
      type: mongoose.Schema.ObjectId,
      ref: "EquipmentManufacturer",
      required: [true, "A equipmentModel must have a manufacturer"],
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

// equipmentModelSchema.index({
//   name: "text",
//   description: "text",
//   // manufacturer: "text",
//   // type: "text",
// });

// EquipmentModel.createIndex({
// equipmentModelSchema.index({
//   name: "text",
//   description: "text",
//   "type.name": "text",
//   "manufacturer.name": "text",
// });

// equipmentModelSchema.post("save", async function (next) {
//   // this.constructor = The Review model, Which isn't created yet, but that is a method to reach it
//   // this.constructor.calcAverageRatings(this.tour);
//   const equipmentType = await EquipmentType.findById(this.type);
//   if (equipmentType.listOfManufacturers.indexOf(this.manufacturer) == -1) {
//     equipmentType.listOfManufacturers.push(this.manufacturer);
//   }

//   await equipmentType.save();

//   // next(); //post middleware doesn't have next function
// });

equipmentModelSchema.post("findOneAndDelete", async function (doc) {
  console.log("doc", doc._id);
  const quotes = await Quote.deleteMany({ model: doc._id });
});

const EquipmentModel = mongoose.model("EquipmentModel", equipmentModelSchema);

module.exports = EquipmentModel;

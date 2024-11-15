const mongoose = require("mongoose");
const validator = require("validator");

const quoteSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A quote must have a name"],
    },
    email: {
      type: String,
      required: [true, "A quote must have a email"],
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    model: {
      type: mongoose.Schema.ObjectId,
      ref: "EquipmentModel",
      required: [true, "A quote must have a EquipmentModel"],
    },
    message: {
      type: String,
      required: [true, "A quote must have a message"],
    },
  },
  { timestamps: true }
);

const Quote = mongoose.model("Quote", quoteSchema);

module.exports = Quote;

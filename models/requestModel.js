const mongoose = require("mongoose");
const validator = require("validator");

const requestSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A request must have a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "A request must have an email"],
      validate: [validator.isEmail, "Please enter a valid email"],
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "A request must have a phone number"],
      validate: {
        validator: (value) => validator.isMobilePhone(value, "any"),
        message: "Please enter a valid phone number",
      },
    },
    date: {
      type: Date,
      required: [true, "A request must have a date"],
      validate: {
        validator: (value) => value >= new Date(),
        message: "Date cannot be in the past",
      },
    },
    status: {
      type: String,
      enum: ["New", "Contacted"],
      default: "New",
    },
  },
  { timestamps: true }
);

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;

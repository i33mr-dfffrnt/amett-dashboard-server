const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "A user must have a username"],
    unique: [true, "Username must be unique"],
    validate: [
      validator.isAlphanumeric,
      "Please enter a valid username, a valid username can be only letters and numbers",
    ],
  },

  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false,
  },
});

adminSchema.pre("save", async function (next) {
  // Only run this if password was modified (the account is new, changed password)
  // if (!this.isModified("password")) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field (not stored in the database)
  this.passwordConfirm = undefined;

  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  // compare the candidatePassword with the one in db by encrypting it
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;

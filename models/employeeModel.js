const mongoose = require("mongoose");

const employeeSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "A employee must have a name"],
  },
  email: {
    type: String,
    required: [true, "A employee must have an email"],
  },
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;

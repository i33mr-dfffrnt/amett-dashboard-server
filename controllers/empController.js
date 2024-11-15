const Employee = require("../models/employeeModel");
const catchAsyncError = require("../utils/catchAsyncError");

exports.getAllEmps = catchAsyncError(async (req, res, next) => {
  const employees = await Employee.find();

  res.status(200).json({
    status: "success",
    data: {
      employees,
    },
  });
});

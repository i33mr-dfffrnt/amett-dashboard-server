const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const Request = require("../models/requestModel");

exports.createRequest = catchAsyncError(async (req, res, next) => {
  const { name, email, phone, date } = req.body;

  if (!name || !email || !phone || !date) {
    return next(new AppError("Please enter all the required fields", 400));
  }

 
  const request = await Request.create({
    name,
    email,
    phone,
    date
  });



  console.log(request);

  res.status(201).json({
    status: "success",
    data: {
        request
    },
  });
});

exports.getAllRequests = catchAsyncError(async (req, res, next) => {
  const requests = await Request.find(req.query);

  console.log(requests);

  res.status(200).json({
    status: "success",
    data: {
      requests,
    },
  });
});

exports.deleteRequest = catchAsyncError(async (req, res, next) => {
  const request = await Request.findByIdAndDelete(req.params.requestId);

  if (!request) {
    return next(new AppError("No request found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiRequests = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const requests = await Request.find({ _id: { $in: deleteArray } });

  if (!requests.length) {
    return next(new AppError("No requests found with that ID", 404));
  }

  const deleteDocs = await Request.deleteMany({ _id: { $in: deleteArray } });

  res.status(204).json({
    status: "success",
    data: null,
  });
});


exports.updateRequest = catchAsyncError(async (req, res, next) => {
  // We only need to update the status to "contacted"
  const updateObject = { status: "contacted" };

  // Update the request by finding the request ID and updating only the status
  const request = await Request.findByIdAndUpdate(req.params.requestId, updateObject, {
    new: true,       // Return the updated document
    runValidators: true,  // Ensure the validation rules are applied
  });

  if (!request) {
    return next(new AppError("No request found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      request,
    },
  });
});




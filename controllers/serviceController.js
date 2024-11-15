const Employee = require("../models/employeeModel");
const ServiceRequest = require("../models/serviceRequestModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");

const nodemailer = require("nodemailer");

exports.createService = catchAsyncError(async (req, res, next) => {
  const { name, email, sType, dType, manufacturer, serialNo, site, location, problem, notes } =
    req.body;
  console.log(req.body);
  if (
    !name ||
    !email ||
    !sType ||
    !dType ||
    !manufacturer ||
    !serialNo ||
    !site ||
    !location ||
    !problem
  ) {
    return next(new AppError("Please enter all the required fields", 400));
  }

  const serviceRequest = await ServiceRequest.create({
    name,
    email,
    serviceType: sType,
    deviceType: dType,
    deviceManufacturer: manufacturer,
    serialNo,
    deviceSite: site,
    deviceLocation: location,
    problemDescription: problem,
    notes,
    status: "Pending",
  });

  const message = `
	Requester Name: ${name}
	Email: ${email}
	Service Type: ${sType}
	Device Type: ${dType}
	Device Manufacturer: ${manufacturer}
	Serial Number: ${serialNo}
	Service Site: ${site}
	Service Location: ${location}
	Problem: ${problem}
	Notes: ${notes}
	Employees link to confirm: https://www.amett.net/service/status/${serviceRequest._id}
	-----------------------------------------------------------------------------------------
	Please note that the content of this email is confidential. Reply to the client in a separate email.
	`;

  const employees = await Employee.find();
  const emailStrings = employees.map((el) => {
    return el.email;
  });
  const transport = nodemailer.createTransport({
    service: "SendinBlue",
    auth: {
      user: "omarmohmmed0@gmail.com",
      pass: "2mwGQvjfpTghXyqN",
    },
  });
  const mailOptions = {
    from: email,
    to: emailStrings,
    subject: `New Service Request: ${sType} on ${dType}`,
    text: message,
  };

  await transport.sendMail(mailOptions);

  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.getServiceRequest = catchAsyncError(async (req, res, next) => {
  const serviceRequest = await ServiceRequest.findById(req.params.serviceId).populate(
    "assignedEmployee"
  );

  if (!serviceRequest) {
    return next(new AppError("No serviceRequest found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      serviceRequest,
    },
  });
});

exports.acceptService = catchAsyncError(async (req, res, next) => {
  const serviceRequest = await ServiceRequest.findById(req.params.serviceId);

  const { assignedEmp } = req.body;
  if (!serviceRequest) {
    return next(new AppError("No serviceRequest found with that ID", 404));
  }

  serviceRequest.status = "Accepted";
  serviceRequest.assignedEmployee = assignedEmp;

  serviceRequest.save();

  res.status(200).json({
    status: "success",
    data: {
      serviceRequest,
    },
  });
});

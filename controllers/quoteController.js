const nodemailer = require("nodemailer");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const Quote = require("../models/quoteModel");

exports.createQuote = catchAsyncError(async (req, res, next) => {
  const { name, email, modelName, message, modelId } = req.body;
  console.log(req.body);
  if (!name || !email || !modelName || !message || !modelId) {
    return next(new AppError("Please enter all the required fields", 400));
  }

  const transport = nodemailer.createTransport({
    service: "SendinBlue",
    auth: {
      user: "omarmohmmed0@gmail.com",
      pass: "2mwGQvjfpTghXyqN",
    },
  });
  console.log("mailOptions");

  const mailOptions = {
    from: email,
    to: "sales@amett.net",
    subject: `Quote request for ${modelName} by ${name}`,
    text: message,
  };
  console.log(mailOptions);

  await transport.sendMail(mailOptions);

  // const quote = await Quote.create({
  //   name,
  //   email,
  //   modelId,
  //   message,
  // });

  const quote = await Quote.create({
    name,
    email,
    modelName,
    message,
    model: modelId,
  });

  res.status(200).json({
    status: "success",
    data: {
      quote,
    },
  });
});

exports.getAllQuotes = catchAsyncError(async (req, res, next) => {
  // const quotes = new QueryFunctions(Quote.find().populate("auction"), req.query)
  //   .filter()
  //   .sort()
  //   .limitFields()
  //   .paginate();
  const quotes = await Quote.find(req.query).populate("model");

  res.status(200).json({
    status: "success",
    data: {
      quotes,
    },
  });
});

exports.getQuote = catchAsyncError(async (req, res, next) => {
  const quote = await Quote.findById(req.params.quoteId);

  if (!quote) {
    return next(new AppError("No quote found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      quote,
    },
  });
});

exports.deleteQuote = catchAsyncError(async (req, res, next) => {
  const quote = await Quote.findByIdAndDelete(req.params.quoteId);

  if (!quote) {
    return next(new AppError("No quote found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiQuote = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const quotes = await Quote.deleteMany({ _id: { $in: deleteArray } });
  // if (!quotes.length) {
  //   return next(new AppError("No quotes found with that ID", 404));
  // }

  // await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

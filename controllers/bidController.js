const EquipmentType = require("../models/equipmentTypeModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const myS3Client = require("../utils/myS3Client");
const Bid = require("../models/bidModel");
const QueryFunctions = require("../utils/queryFunctions");
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY,
    secretAccessKey: process.env.AWS_USER_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

exports.createBid = catchAsyncError(async (req, res, next) => {
  const { name, email, bid, message, auctionName, auction } = req.body;
  if (!name || !email || !bid || !message || !auctionName || !auction) {
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
    subject: `Bid for ${auctionName} by ${name}`,
    text: `${message}  \nBid: ${bid} \n Link to the auction: http://localhost:3000/auctions/${auction}`,
    // text: `${message}  \nBid: ${bid} \n Link to the auction: `,
  };

  await transport.sendMail(mailOptions);

  const bidDoc = await Bid.create({
    name,
    email,
    bid,
    message,
    auctionName,
    auction,
  });

  res.status(200).json({
    status: "success",
    data: {
      // quote,
      bidDoc,
    },
  });
});

exports.getAllBids = catchAsyncError(async (req, res, next) => {
  const bids = await Bid.find(req.query).populate("auction");

  res.status(200).json({
    status: "success",
    data: {
      bids,
    },
  });
});

exports.getBid = catchAsyncError(async (req, res, next) => {
  const bid = await Bid.findById(req.params.bidId);

  if (!bid) {
    return next(new AppError("No bid found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      bid,
    },
  });
});

exports.deleteBid = catchAsyncError(async (req, res, next) => {
  const bid = await Bid.findByIdAndDelete(req.params.bidId);

  if (!bid) {
    return next(new AppError("No bid found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiBid = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const bids = await Bid.deleteMany({ _id: { $in: deleteArray } });
  // if (!bids.length) {
  //   return next(new AppError("No bids found with that ID", 404));
  // }

  // await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

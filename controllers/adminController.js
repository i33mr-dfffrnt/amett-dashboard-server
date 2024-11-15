const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { promisify } = require("util");
const bcrypt = require("bcrypt");

const Admin = require("../models/adminModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");

const signJWT = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendJWT = (admin, statusCode, res, origin) => {
  console.log("admin", admin);
  const token = signJWT(admin._id);

  console.log(origin);

  // Remove the password from the output
  admin.password = undefined;

  // TODO:Add Secure after deployment
  // res.cookie("jwt", token, { httpOnly: true, secure: true });
  // res.cookie("jwt", token, { httpOnly: true, secure: true, domain: "amett.net", path: "/" });
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    domain: origin === "https://amett.net" ? "amett.net" : "www.amett.net",
    path: "/",
  });
  res.status(statusCode).json({
    status: "success",
    data: null,
  });
};

// exports.temp = catchAsyncError(async (req, res, next) => {
//   const { username, password } = req.body;
//   const admin = await Admin.create({ username, password });
//   res.status(200).json({
//     status: "success",
//     data: {
//       // admin,
//       admin,
//     },
//   });
// });

exports.login = catchAsyncError(async (req, res, next) => {
  // console.log(await Admin.find({ username }));
  // const hashedPassword = await bcrypt.hash(password, 12);
  // const newUser = await Admin.create({
  //   username: req.body.username,
  //   password: hashedPassword,
  // });
  const { username, password } = req.body;

  console.log(req.body);
  if (!username || !password) {
    return next(new AppError("Please provide username and a password", 400));
  }
  let admin;

  admin = await Admin.findOne({ username }).select("+password");

  if (!admin || !(await admin.comparePassword(password, admin.password))) {
    return next(new AppError("Username or password are incorrect", 401));
  }

  // res.status(200).json({
  //   status: "success",
  //   data: {},
  // });
  createAndSendJWT(admin, 200, res, req.get("origin"));
});

exports.requireAuth = catchAsyncError(async (req, res, next) => {
  // Get the token from the authorization header
  let token;
  // if (req.headers.authorization) {
  //   token = req.headers.authorization.replace("Bearer ", "");
  // }
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // else {
  //   // TODO:Remove this, for now keep for api testing
  //   token = req.headers.authorization.replace("Bearer ", "");
  // }
  console.log(token);
  if (!token) {
    return next(new AppError("You aren't logged in, please log in to get access", 401));
  }

  // Verify that token wasn't modified
  const decodedJWT = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Checking if user still exists (useful with account deletion feature)
  const admin = await Admin.findById(decodedJWT.id);
  if (!admin) {
    return next(new AppError("The user belonging to this token does no longer exist. ", 401));
  }

  // Check if user changed password after the token was issued
  // if user changed the password after the token was issued, send an error
  // iat: issued at

  // GRANT ACCESS TO THE PROTECTED ROUTE, the signed in user will be now available on the req object
  // req.user = user;
  next();
});

exports.checkRouteAuth = catchAsyncError(async (req, res, next) => {
  // Get the token from the authorization header
  let token;
  // if (req.headers.authorization) {
  //   token = req.headers.authorization.replace("Bearer ", "");
  // }
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError("You aren't logged in, please log in to get access", 401));
  }

  // Verify that token wasn't modified
  const decodedJWT = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Checking if user still exists (useful with account deletion feature)
  const admin = await Admin.findById(decodedJWT.id);
  if (!admin) {
    return next(new AppError("The user belonging to this token does no longer exist. ", 401));
  }

  // Check if user changed password after the token was issued
  // if user changed the password after the token was issued, send an error
  // iat: issued at

  // GRANT ACCESS TO THE PROTECTED ROUTE, the signed in user will be now available on the req object
  // req.user = user;
  // next();
  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.temp = catchAsyncError(async (req, res, next) => {
  const { username, password } = req.body;
  const admin = await Admin.create({ username, password });
  res.status(200).json({
    status: "success",
    data: {
      // admin,
      admin,
    },
  });
});

exports.logout = catchAsyncError(async (req, res, next) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    domain: req.get("origin") === "https://amett.net" ? "amett.net" : "www.amett.net",
    path: "/",
  });

  res.status(200).json({
    status: "success",
    data: null,
  });
});

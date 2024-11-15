const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY,
    secretAccessKey: process.env.AWS_USER_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const multerStorage = multer.memoryStorage();
// To test the file type, here we need an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, please upload images only", 400), true);
  }
};

// used to upload image from the user to the file system
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// exports.uploadImage = upload.single("image");
exports.uploadImage = (imgName) => {
  return upload.single(imgName);
};

exports.resizeImage = (width = 1200, height = 700, fitInside = false) =>
  catchAsyncError(async (req, res, next) => {
    if (!req.file) return next();

    // req.file.filename = `${req.body.carouselTitle}-${Date.now()}.jpeg`;
    req.file.filename = `${generateFileName()}.jpeg`;

    if (req.body.carouselTitle === "store-carousel") {
      height = 1200;
      width = 1200;
    }
    console.log(req.file);

    // to avoid resizing sponsor logos
    if (width === 0) {
      req.file.buffer = await sharp(req.file.buffer)
        .flatten({ background: "#ffffff" })
        .toFormat("jpeg")
        .jpeg({ quality: 80 })
        .toBuffer();
    } else {
      if (fitInside) {
        req.file.buffer = await sharp(req.file.buffer)
          .flatten({ background: "#E5E7EB" })
          .resize({ width, height, fit: "inside", background: "#E5E7EB" })
          .toFormat("jpeg")
          .jpeg({ quality: 80 })
          .toBuffer();
      } else {
        req.file.buffer = await sharp(req.file.buffer)
          .flatten({ background: "#E5E7EB" })
          .resize({ width, height })
          .toFormat("jpeg")
          .jpeg({ quality: 80 })
          .toBuffer();
      }
    }
    // .toFile(`public/img/${req.body.carouselTitle}/${req.file.filename}`);

    next();
  });

exports.sendImageToS3Bucket = catchAsyncError(async (req, res, next) => {
  if (!req.file) return next();

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: req.file.filename,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };
  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  next();
});

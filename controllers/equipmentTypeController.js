const EquipmentType = require("../models/equipmentTypeModel");
const EquipmentModel = require("../models/equipmentModelModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const myS3Client = require("../utils/myS3Client");
const Quote = require("../models/quoteModel");

exports.createEquipmentType = catchAsyncError(async (req, res, next) => {
  console.log("creating equip type", req.body);

  const { name } = req.body;
  if (!name) {
    return next(new AppError("Please enter all the required fields", 400));
  }

  const equipmentType = await EquipmentType.create({
    name,
  });

  console.log(equipmentType);

  res.status(200).json({
    status: "success",
    data: {
      equipmentType,
    },
  });
});

exports.getEquipmentType = catchAsyncError(async (req, res, next) => {
  const equipmentType = await EquipmentType.findById(req.params.equipmentTypeId);

  if (!equipmentType) {
    return next(new AppError("No equipmentType found with that ID", 404));
  }
  const options = { type: req.params.equipmentTypeId };
  if (req.query.status === "Active") {
    options.status = "Active";
  }

  res.status(200).json({
    status: "success",
    data: {
      equipmentType,
    },
  });
});

exports.getAllEquipmentTypes = catchAsyncError(async (req, res, next) => {
  const equipmentTypes = await EquipmentType.find();

  res.status(200).json({
    status: "success",
    data: {
      equipmentTypes,
    },
  });
});

exports.deleteEquipmentType = catchAsyncError(async (req, res, next) => {
  const equipmentType = await EquipmentType.findByIdAndDelete(req.params.equipmentTypeId);

  if (!equipmentType) {
    return next(new AppError("No equipmentType found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiTypes = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const equipmentTypes = await EquipmentType.find({ _id: { $in: deleteArray } });
  const equipmentModels = await EquipmentModel.find({ type: { $in: deleteArray } });
  const quotes = await Quote.deleteMany({ model: { $in: equipmentModels } });
  await EquipmentModel.deleteMany({ type: { $in: deleteArray } });

  console.log(req.body);
  console.log(equipmentTypes);

  if (!equipmentTypes.length) {
    return next(new AppError("No equipmentTypes found with that ID", 404));
  }

  await EquipmentType.deleteMany({ _id: { $in: deleteArray } });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateType = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;
  console.log("upd type", req.body);

  const updateObject = {
    name,
  };

  const equipmentType = await EquipmentType.findByIdAndUpdate(
    req.params.equipmentTypeId,
    updateObject,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!equipmentType) {
    return next(new AppError("No equipmentType found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      equipmentType,
    },
  });
});

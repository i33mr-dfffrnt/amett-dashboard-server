const EquipmentModel = require("../models/equipmentModelModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const QueryFunctions = require("../utils/queryFunctions");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {GetObjectCommand } = require("@aws-sdk/client-s3");

const myS3Client = require("../utils/myS3Client");

const EquipmentType = require("../models/equipmentTypeModel");


exports.getMenu = catchAsyncError(async (req, res, next) => {

  const queryFunctions = new QueryFunctions(
    EquipmentType.find(),
    req.query
  );

  // Use the corrected populate function
  // needs to be updated to match services
  const equipmentTypesWithModels = await queryFunctions.populateModelsWithTypes(
    EquipmentType.collection,
    EquipmentModel.collection
  );

  const menuData = {services: equipmentTypesWithModels , equipment : equipmentTypesWithModels };


  res.status(200).json({
    status: "success",
    data: menuData,
  });
});

exports.getAllEquipmentModels = catchAsyncError(async (req, res, next) => {
  const queryFunctions = new QueryFunctions(
    EquipmentModel.find().populate("type").populate("manufacturer"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // console.log(queryFunctions.queryString);
  const equipmentModels = await queryFunctions.query;
  // const equipmentModels = await EquipmentModel.find();

  for (let equipmentModel of equipmentModels) {
    equipmentModel._doc.imageUrl = "null.png"
    
    // await getSignedUrl(
    //   myS3Client,
    //   new GetObjectCommand({
    //     Bucket: process.env.BUCKET_NAME,
    //     Key: equipmentModel.image,
    //   }),
    //   { expiresIn: 3600 }
    // );
  }

  res.status(200).json({
    status: "success",
    data: {
      equipmentModels,
    },
  });
});




exports.getModel = catchAsyncError(async (req, res, next) => {
  const equipmentModel = await EquipmentModel.findById(req.params.equipmentModelId)
    .populate("type")
    .populate("manufacturer");

  if (!equipmentModel) {
    return next(new AppError("No equipmentModel found with that ID", 404));
  }

  if (req.query.status === "Active" && equipmentModel.status === "Inactive") {
    return next(new AppError("You can't access this auction", 401));
  }

  // for (let equipmentModel of equipmentModels) {
  equipmentModel._doc.imageUrl = await getSignedUrl(
    myS3Client,
    new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: equipmentModel.image,
    }),
    { expiresIn: 3600 }
  );
  // }

  res.status(200).json({
    status: "success",
    data: {
      equipmentModel,
    },
  });
});


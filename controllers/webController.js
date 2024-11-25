const EquipmentModel = require("../models/equipmentModelModel");
const Service = require("../models/serviceModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const QueryFunctions = require("../utils/queryFunctions");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

const myS3Client = require("../utils/myS3Client");

const EquipmentType = require("../models/equipmentTypeModel");
const ServiceType = require("../models/serviceTypeModel");

exports.getMenu = catchAsyncError(async (req, res, next) => {
  const equipmentQueryFunctions = new QueryFunctions(EquipmentType.find(), req.query);
  const serviceQueryFunctions = new QueryFunctions(Service.find(), req.query);

  // Use the corrected populate function
  // needs to be updated to match services
  const equipmentTypesWithModels = await equipmentQueryFunctions.populateModelsWithTypes(
    EquipmentType.collection,
    EquipmentModel.collection
  );

  const serviceTypesWithModels = await serviceQueryFunctions.populateServicesWithTypes(
    ServiceType.collection,
    Service.collection
  );
  const menuData = { services: serviceTypesWithModels, equipment: equipmentTypesWithModels };

  console.log("menuData: ", menuData);

  res.status(200).json({
    status: "success",
    data: menuData,
  });
});

exports.getFeaturedEquipmentModels = catchAsyncError(async (req, res, next) => {
  // Construct the query to get the latest 9 active equipment models
  const queryFunctions = new QueryFunctions(
    EquipmentModel.find({ status: "Active" }) // Filter for active models
      .sort({ createdAt: -1 }) // Sort by newest models first
      .limit(9) // Limit to the latest 9 models
      .populate("type") // Populate the "type" field
      .populate("manufacturer"), // Populate the "manufacturer" field
    req.query
  )
    .filter()
    .limitFields(); // No additional pagination needed for 9 items

  // Execute the query
  let equipmentModels = await queryFunctions.query;

  // Add image URL and dynamic link to each equipment model
  for (let equipmentModel of equipmentModels) {
    equipmentModel._doc.linkTo = `/product/${equipmentModel._id}`; // Add dynamic link based on ID
    equipmentModel._doc.imageUrl = "null.png"; // Default image URL
    // Uncomment below to fetch signed URL for images from S3
    // equipmentModel._doc.imageUrl = await getSignedUrl(
    //   myS3Client,
    //   new GetObjectCommand({
    //     Bucket: process.env.BUCKET_NAME,
    //     Key: equipmentModel.image,
    //   }),
    //   { expiresIn: 3600 }
    // );
  }

  console.log(equipmentModels);

  // Respond with the filtered and processed data
  res.status(200).json({
    status: "success",
    data: {
      equipmentModels,
    },
  });
});

exports.getFeaturedServices = catchAsyncError(async (req, res, next) => {
  // Construct the query to get the latest 4 active service
  const limit = Math.max(1, parseInt(req.query.limit)) || 4; //
  console.log("limit", limit);

  const queryFunctions = new QueryFunctions(
    Service.find({ status: "Active" }) // Filter for active
      .sort({ createdAt: -1 }) // Sort by newest service first
      .limit(limit) // Limit to the latest 4 service
      .populate("type"), // Populate the "type" field
    req.query
  )
    .filter()
    .limitFields(); // No additional pagination needed for 9 items

  // Execute the query
  let services = await queryFunctions.query;

  // Add image URL and dynamic link to each service
  for (let service of services) {
    service._doc.linkTo = `/service/${service._id}`; // Add dynamic link based on ID
    service._doc.imageUrl = "null.png"; // Default image URL
    // Uncomment below to fetch signed URL for images from S3
    // service._doc.imageUrl = await getSignedUrl(
    //   myS3Client,
    //   new GetObjectCommand({
    //     Bucket: process.env.BUCKET_NAME,
    //     Key: service.image,
    //   }),
    //   { expiresIn: 3600 }
    // );
  }

  console.log(services);

  // Respond with the filtered and processed data
  res.status(200).json({
    status: "success",
    data: {
      services,
    },
  });
});

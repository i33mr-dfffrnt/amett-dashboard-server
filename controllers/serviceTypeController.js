const ServiceType = require("../models/serviceTypeModel");
const Service = require("../models/serviceModel");
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

exports.createServiceType = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;
  if (!name || !req.file?.filename) {
    return next(new AppError("Please enter all the required fields", 400));
  }

  const serviceType = await ServiceType.create({
    name,
    image: req.file.filename,
  });

  res.status(200).json({
    status: "success",
    data: {
      serviceType,
    },
  });
});

exports.getServiceType = catchAsyncError(async (req, res, next) => {
  const serviceType = await ServiceType.findById(req.params.serviceTypeId);

  if (!serviceType) {
    return next(new AppError("No serviceType found with that ID", 404));
  }
  const options = { type: req.params.serviceTypeId };
  if (req.query.status === "Active") {
    options.status = "Active";
  }
  const services = await Service.find(options);
  serviceType._doc.listOfManufacturers = [...new Set(services.map((model) => model.manufacturer))];

  serviceType._doc.imageUrl = await getSignedUrl(
    myS3Client,
    new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: serviceType.image,
    }),
    { expiresIn: 3600 }
  );

  // for (let manufacturer of serviceType._doc.listOfManufacturers) {
  //   manufacturer._doc.imageUrl = await getSignedUrl(
  //     myS3Client,
  //     new GetObjectCommand({
  //       Bucket: process.env.BUCKET_NAME,
  //       Key: manufacturer.image,
  //     }),
  //     { expiresIn: 3600 }
  //   );
  // }
  console.log(serviceType);

  res.status(200).json({
    status: "success",
    data: {
      serviceType,
    },
  });
});

exports.getAllServiceTypes = catchAsyncError(async (req, res, next) => {
  const serviceTypes = await ServiceType.find();

  // for (let serviceType of serviceTypes) {
  //   serviceType._doc.imageUrl = "null.png";
  //   // await getSignedUrl(
  //   //   myS3Client,
  //   //   new GetObjectCommand({
  //   //     Bucket: process.env.BUCKET_NAME,
  //   //     Key: serviceType.image,
  //   //   }),
  //   //   { expiresIn: 3600 }
  //   // );
  //   const services = await Service.find({ type: serviceType._id });
  //   serviceType._doc.listOfManufacturers = [
  //     ...new Set(services.map((model) => model.manufacturer._id.toString())),
  //   ];
  // }

  res.status(200).json({
    status: "success",
    data: {
      serviceTypes,
    },
  });
});

exports.deleteServiceType = catchAsyncError(async (req, res, next) => {
  const serviceType = await ServiceType.findByIdAndDelete(req.params.serviceTypeId);
  console.log("deleting service type");

  if (!serviceType) {
    return next(new AppError("No serviceType found with that ID", 404));
  }

  // const deleteParams = {
  //   Bucket: process.env.BUCKET_NAME,
  //   Key: serviceType.image,
  // };

  // await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiTypes = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const serviceTypes = await ServiceType.find({ _id: { $in: deleteArray } });
  const services = await Service.find({ type: { $in: deleteArray } });
  const quotes = await Quote.deleteMany({ model: { $in: services } });
  await Service.deleteMany({ type: { $in: deleteArray } });

  console.log("delete many");

  console.log(req.body);
  console.log(serviceTypes);

  if (!serviceTypes.length) {
    return next(new AppError("No serviceTypes found with that ID", 404));
  }

  const deleteDocs = await ServiceType.deleteMany({ _id: { $in: deleteArray } });

  // const imagesToDelete = serviceTypes.map((option) => {
  //   return {
  //     Key: option.image,
  //   };
  // });

  // console.log(
  //   imagesToDelete.concat(
  //     services.map((option) => {
  //       return {
  //         Key: option.image,
  //       };
  //     })
  //   )
  // );

  // if (serviceTypes.length) {
  //   deleteParams = {
  //     Bucket: process.env.BUCKET_NAME,
  //     Delete: {
  //       // Objects: imagesToDelete,
  //       Objects: imagesToDelete.concat(
  //         services.map((option) => {
  //           return {
  //             Key: option.image,
  //           };
  //         })
  //       ),
  //     },
  //   };

  //   await myS3Client.send(new DeleteObjectsCommand(deleteParams));
  // }
  // await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateType = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;
  console.log(req.body);

  const updateObject = {
    name,
  };

  if (req.file) {
    updateObject.image = req.file.filename;
    // consider deleting old image if new image was uploaded
  }

  const serviceType = await ServiceType.findByIdAndUpdate(req.params.serviceTypeId, updateObject, {
    new: true,
    runValidators: true,
  });

  if (!serviceType) {
    return next(new AppError("No serviceType found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      serviceType,
    },
  });
});
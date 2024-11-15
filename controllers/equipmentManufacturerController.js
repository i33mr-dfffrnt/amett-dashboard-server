const EquipmentManufacturer = require("../models/equipmentManufacturerModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const myS3Client = require("../utils/myS3Client");
const EquipmentModel = require("../models/equipmentModelModel");
const Quote = require("../models/quoteModel");

exports.createEquipmentManufacturer = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;
  if (!name || !req.file?.filename) {
    return next(new AppError("Please enter all the required fields", 400));
  }

  const equipmentManufacturer = await EquipmentManufacturer.create({
    name,
    image: req.file.filename,
  });

  res.status(200).json({
    status: "success",
    data: {
      equipmentManufacturer,
    },
  });
});

exports.getAllEquipmentManufacturers = catchAsyncError(async (req, res, next) => {
  const equipmentManufacturers = await EquipmentManufacturer.find();

  for (let equipmentManufacturer of equipmentManufacturers) {
    equipmentManufacturer._doc.imageUrl = await getSignedUrl(
      myS3Client,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: equipmentManufacturer.image,
      }),
      { expiresIn: 3600 }
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      equipmentManufacturers,
    },
  });
});

exports.deleteEquipmentManufacturer = catchAsyncError(async (req, res, next) => {
  const equipmentManufacturer = await EquipmentManufacturer.findByIdAndDelete(
    req.params.equipmentManufacturerId
  );

  if (!equipmentManufacturer) {
    return next(new AppError("No equipmentManufacturer found with that ID", 404));
  }

  const deleteParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: equipmentManufacturer.image,
  };

  await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiManufacturers = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const equipmentManufacturers = await EquipmentManufacturer.find({ _id: { $in: deleteArray } });
  const equipmentModels = await EquipmentModel.find({ manufacturer: { $in: deleteArray } });
  const quotes = await Quote.deleteMany({ model: { $in: equipmentModels } });
  await EquipmentModel.deleteMany({ manufacturer: { $in: deleteArray } });

  console.log(req.body);
  console.log(equipmentManufacturers);

  if (!equipmentManufacturers.length) {
    return next(new AppError("No equipmentManufacturers found with that ID", 404));
  }

  const deleteDocs = await EquipmentManufacturer.deleteMany({ _id: { $in: deleteArray } });

  const imagesToDelete = equipmentManufacturers.map((option) => {
    return {
      Key: option.image,
    };
  });

  if (equipmentManufacturers.length) {
    deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Delete: {
        // Objects: imagesToDelete,
        Objects: imagesToDelete.concat(
          equipmentModels.map((option) => {
            return {
              Key: option.image,
            };
          })
        ),
      },
    };

    await myS3Client.send(new DeleteObjectsCommand(deleteParams));
  }
  // await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getManufacturer = catchAsyncError(async (req, res, next) => {
  const equipmentManufacturer = await EquipmentManufacturer.findById(
    req.params.equipmentManufacturerId
  );

  if (!equipmentManufacturer) {
    return next(new AppError("No equipmentManufacturer found with that ID", 404));
  }

  // for (let equipmentManufacturer of equipmentManufacturers) {
  equipmentManufacturer._doc.imageUrl = await getSignedUrl(
    myS3Client,
    new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: equipmentManufacturer.image,
    }),
    { expiresIn: 3600 }
  );
  // }

  res.status(200).json({
    status: "success",
    data: {
      equipmentManufacturer,
    },
  });
});

exports.updateManufacturer = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;
  console.log(req.body);

  const updateObject = {
    name,
  };

  if (req.file) {
    updateObject.image = req.file.filename;
    // consider deleting old image if new image was uploaded
  }

  const equipmentManufacturer = await EquipmentManufacturer.findByIdAndUpdate(
    req.params.equipmentManufacturerId,
    updateObject,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!equipmentManufacturer) {
    return next(new AppError("No equipmentManufacturer found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      equipmentManufacturer,
    },
  });
});

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
  const { name } = req.body;
  if (!name || !req.file?.filename) {
    return next(new AppError("Please enter all the required fields", 400));
  }

  const equipmentType = await EquipmentType.create({
    name,
    image: req.file.filename,
  });

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
  const equipmentModels = await EquipmentModel.find(options).populate("manufacturer");
  equipmentType._doc.listOfManufacturers = [
    ...new Set(equipmentModels.map((model) => model.manufacturer)),
  ];

  equipmentType._doc.imageUrl = await getSignedUrl(
    myS3Client,
    new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: equipmentType.image,
    }),
    { expiresIn: 3600 }
  );

  for (let manufacturer of equipmentType._doc.listOfManufacturers) {
    manufacturer._doc.imageUrl = await getSignedUrl(
      myS3Client,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: manufacturer.image,
      }),
      { expiresIn: 3600 }
    );
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

  for (let equipmentType of equipmentTypes) {
    equipmentType._doc.imageUrl = "null.png"
    // await getSignedUrl(
    //   myS3Client,
    //   new GetObjectCommand({
    //     Bucket: process.env.BUCKET_NAME,
    //     Key: equipmentType.image,
    //   }),
    //   { expiresIn: 3600 }
    // );
    const equipmentModels = await EquipmentModel.find({ type: equipmentType._id });
    equipmentType._doc.listOfManufacturers = [
      ...new Set(equipmentModels.map((model) => model.manufacturer._id.toString())),
    ];
  }

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

  const deleteParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: equipmentType.image,
  };

  await myS3Client.send(new DeleteObjectCommand(deleteParams));

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

  const deleteDocs = await EquipmentType.deleteMany({ _id: { $in: deleteArray } });

  const imagesToDelete = equipmentTypes.map((option) => {
    return {
      Key: option.image,
    };
  });

  console.log(
    imagesToDelete.concat(
      equipmentModels.map((option) => {
        return {
          Key: option.image,
        };
      })
    )
  );

  if (equipmentTypes.length) {
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

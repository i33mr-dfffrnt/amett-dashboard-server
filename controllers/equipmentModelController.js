const EquipmentModel = require("../models/equipmentModelModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const QueryFunctions = require("../utils/queryFunctions");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const myS3Client = require("../utils/myS3Client");
const Quote = require("../models/quoteModel");
const EquipmentType = require("../models/equipmentTypeModel");

exports.createEquipmentModel = catchAsyncError(async (req, res, next) => {
  const { name, description, type, manufacturer } = req.body;
  // if (!name || !description || !type || !manufacturer || !req.file?.filename) {
  //   return next(new AppError("Please enter all the required fields", 400));
  // }

  const equipmentModel = await EquipmentModel.create({
    name,
    description,
    type,
    manufacturer,
    image: "test",
  });

  res.status(200).json({
    status: "success",
    data: {
      equipmentModel,
    },
  });
});

exports.deleteEquipmentModel = catchAsyncError(async (req, res, next) => {
  const equipmentModel = await EquipmentModel.findByIdAndDelete(req.params.equipmentModelId);

  if (!equipmentModel) {
    return next(new AppError("No equipmentModel found with that ID", 404));
  }

  const deleteParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: equipmentModel.image,
  };

  await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiModels = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const equipmentModels = await EquipmentModel.find({ _id: { $in: deleteArray } });

  const quotes = await Quote.deleteMany({ model: { $in: deleteArray } });

  console.log(req.body);
  console.log(equipmentModels);

  if (!equipmentModels.length) {
    return next(new AppError("No equipmentModels found with that ID", 404));
  }

  const deleteDocs = await EquipmentModel.deleteMany({ _id: { $in: deleteArray } });

  const imagesToDelete = equipmentModels.map((option) => {
    return {
      Key: option.image,
    };
  });

  if (equipmentModels.length) {
    deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Delete: {
        Objects: imagesToDelete,
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

exports.updateModel = catchAsyncError(async (req, res, next) => {
  const { name, description, type, manufacturer, status } = req.body;
  console.log(req.body);

  const updateObject = {
    name,
    description,
    type,
    manufacturer,
    status,
  };

  if (req.file) {
    updateObject.image = req.file.filename;
    // consider deleting old image if new image was uploaded
  }

  const equipmentModel = await EquipmentModel.findByIdAndUpdate(
    req.params.equipmentModelId,
    updateObject,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!equipmentModel) {
    return next(new AppError("No equipmentModel found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      equipmentModel,
    },
  });
});

exports.searchForEquipmentModels = catchAsyncError(async (req, res, next) => {
  const { searchTerm } = req.params;

  console.log(searchTerm);
  let equipmentModels = await EquipmentModel.aggregate([
    {
      $lookup: {
        from: "equipmenttypes",
        localField: "type",
        foreignField: "_id",
        as: "type",
      },
    },
    {
      $unwind: "$type",
    },
    {
      $lookup: {
        from: "equipmentmanufacturers",
        localField: "manufacturer",
        foreignField: "_id",
        as: "manufacturer",
      },
    },
    {
      $unwind: "$manufacturer",
    },
    {
      $match: {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { "type.name": { $regex: searchTerm, $options: "i" } },
          { "manufacturer.name": { $regex: searchTerm, $options: "i" } },
        ],
      },
    },
  ]);

  // let equipmentModels = await EquipmentModel.aggregate([
  //   {
  //     $search: {
  //       compound: {
  //         should: [
  //           {
  //             text: {
  //               query: searchTerm,
  //               path: ["name", "description"],
  //               score: {
  //                 boost: {
  //                   value: 1,
  //                 },
  //               },
  //               fuzzy: {
  //                 maxEdits: 2,
  //               },
  //             },
  //           },
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "equipmenttypes",
  //       localField: "type",
  //       foreignField: "_id",
  //       as: "type",
  //       pipeline: [
  //         {
  //           $search: {
  //             index: "myIndex",
  //             compound: {
  //               should: [
  //                 {
  //                   text: {
  //                     query: searchTerm,
  //                     path: "name",
  //                     score: {
  //                       boost: {
  //                         value: 1,
  //                       },
  //                     },
  //                     fuzzy: {
  //                       maxEdits: 2,
  //                     },
  //                   },
  //                 },
  //               ],
  //             },
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   {
  //     $unwind: "$type",
  //   },
  //   {
  //     $lookup: {
  //       from: "equipmentmanufacturers",
  //       localField: "manufacturer",
  //       foreignField: "_id",
  //       as: "manufacturer",
  //       pipeline: [
  //         {
  //           $search: {
  //             index: "myIndex",
  //             compound: {
  //               should: [
  //                 {
  //                   text: {
  //                     query: searchTerm,
  //                     path: "name",
  //                     score: {
  //                       boost: {
  //                         value: 1,
  //                       },
  //                     },
  //                     fuzzy: {
  //                       maxEdits: 2,
  //                     },
  //                   },
  //                 },
  //               ],
  //             },
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   {
  //     $unwind: "$manufacturer",
  //   },
  // ]);

  // let equipmentModels = await EquipmentModel.aggregate([
  //   {
  //     $search: {
  //       index: "default",
  //       compound: {
  //         should: [
  //           {
  //             text: {
  //               query: searchTerm,
  //               path: ["name", "description", "type.name", "manufacturer.name"],
  //               score: {
  //                 boost: {
  //                   value: 1,
  //                 },
  //               },
  //               fuzzy: {
  //                 maxEdits: 2,
  //               },
  //             },
  //           },
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "equipmenttypes",
  //       localField: "type",
  //       foreignField: "_id",
  //       as: "type",
  //     },
  //   },
  //   {
  //     $unwind: "$type",
  //   },
  //   {
  //     $lookup: {
  //       from: "equipmentmanufacturers",
  //       localField: "manufacturer",
  //       foreignField: "_id",
  //       as: "manufacturer",
  //     },
  //   },
  //   {
  //     $unwind: "$manufacturer",
  //   },
  // ]);
  // let equipmentModels = await EquipmentModel.aggregate([
  //   {
  //     $search: {
  //       compound: {
  //         should: [
  //           {
  //             text: {
  //               query: searchTerm,
  //               path: "name",
  //               score: {
  //                 boost: {
  //                   value: 1,
  //                 },
  //               },
  //               fuzzy: {
  //                 maxEdits: 2,
  //               },
  //             },
  //           },
  //           {
  //             text: {
  //               query: searchTerm,
  //               path: "description",
  //               fuzzy: {
  //                 maxEdits: 2,
  //               },
  //             },
  //           },
  //         ],
  //       },
  //     },
  //   },
  //   // {
  //   //   $addFields: {
  //   //     score: {
  //   //       $meta: "searchScore",
  //   //     },
  //   //   },
  //   // },
  // ]);

  for (let equipmentModel of equipmentModels) {
    equipmentModel.imageUrl = await getSignedUrl(
      myS3Client,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: equipmentModel.image,
      }),
      { expiresIn: 3600 }
    );
  }

  res.status(200).json({
    status: "success",
    results: equipmentModels.length,
    data: {
      equipmentModels,
    },
  });
});

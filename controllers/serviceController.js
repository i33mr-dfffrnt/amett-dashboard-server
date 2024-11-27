const Service = require("../models/serviceModel");
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
const ServiceType = require("../models/serviceTypeModel");

exports.createService = catchAsyncError(async (req, res, next) => {
  const { name, description, type } = req.body;
  if (!name || !description || !type || !req.file?.filename) {
    return next(new AppError("Please enter all the required fields", 400));
  }

  const service = await Service.create({
    name,
    description,
    type,
    image: req.file.filename,
  });

  res.status(200).json({
    status: "success",
    data: {
      service,
    },
  });
});

exports.deleteService = catchAsyncError(async (req, res, next) => {
  const service = await Service.findByIdAndDelete(req.params.serviceId);

  if (!service) {
    return next(new AppError("No service found with that ID", 404));
  }

  const deleteParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: service.image,
  };

  await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiServices = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const services = await Service.find({ _id: { $in: deleteArray } });

  if (!services.length) {
    return next(new AppError("No services found with that ID", 404));
  }

  const deleteDocs = await Service.deleteMany({ _id: { $in: deleteArray } });

  const imagesToDelete = services.map((option) => {
    return {
      Key: option.image,
    };
  });

  if (services.length) {
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

exports.getAllServices = catchAsyncError(async (req, res, next) => {
  const queryFunctions = new QueryFunctions(Service.find().populate("type"), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // console.log(queryFunctions.queryString);
  const services = await queryFunctions.query;
  // const services = await Service.find();

  for (let service of services) {
    service._doc.imageUrl = await getSignedUrl(
      myS3Client,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: service.image,
      }),
      { expiresIn: 3600 }
    );
  }
  console.log("services", services);

  res.status(200).json({
    status: "success",
    data: {
      services,
    },
  });
});

exports.getServicesBasedOnType = catchAsyncError(async (req, res, next) => {
  // Extract category ID from the request params
  const { categoryId } = req.params;

  // Construct the query with filters and populate related fields
  const queryFunctions = new QueryFunctions(
    Service.find({ type: categoryId }) // Filter by category ID
      .populate("type"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute the query
  let services = await queryFunctions.query;

  // Add image URL to each equipment model (default or derived from logic)
  for (let service of services) {
    service._doc.linkTo = `/service/${service._id}`; // Add dynamic link based on ID
    service._doc.imageUrl = await getSignedUrl(
      myS3Client,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: service.image,
      }),
      { expiresIn: 3600 }
    );
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

exports.getService = catchAsyncError(async (req, res, next) => {
  const service = await Service.findById(req.params.serviceId).populate("type");

  console.log("service", service);

  if (!service) {
    return next(new AppError("No service found with that ID", 404));
  }

  if (req.query.status === "Active" && service.status === "Inactive") {
    return next(new AppError("You can't access this auction", 401));
  }

  service._doc.imageUrl = await getSignedUrl(
    myS3Client,
    new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: service.image,
    }),
    { expiresIn: 3600 }
  );
  console.log(service._doc.imageUrl);

  res.status(200).json({
    status: "success",
    data: {
      service,
    },
  });
});

exports.updateService = catchAsyncError(async (req, res, next) => {
  const { name, description, type, status } = req.body;
  console.log("update service", req.body);

  const updateObject = {
    name,
    description,
    type,
    status,
  };

  if (req.file) {
    updateObject.image = req.file.filename;
    // consider deleting old image if new image was uploaded
  }

  const service = await Service.findByIdAndUpdate(req.params.serviceId, updateObject, {
    new: true,
    runValidators: true,
  });

  if (!service) {
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      service,
    },
  });
});

exports.searchForServices = catchAsyncError(async (req, res, next) => {
  const { searchTerm } = req.params;

  console.log(searchTerm);
  let services = await Service.aggregate([
    {
      $lookup: {
        from: "servicetypes",
        localField: "type",
        foreignField: "_id",
        as: "type",
      },
    },
    {
      $unwind: "$type",
    },
    {
      $match: {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { "type.name": { $regex: searchTerm, $options: "i" } },
        ],
      },
    },
  ]);

  // let services = await Service.aggregate([
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

  // let services = await Service.aggregate([
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
  // let services = await Service.aggregate([
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

  for (let service of services) {
    service.imageUrl = await getSignedUrl(
      myS3Client,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: service.image,
      }),
      { expiresIn: 3600 }
    );
  }

  res.status(200).json({
    status: "success",
    results: services.length,
    data: {
      services,
    },
  });
});

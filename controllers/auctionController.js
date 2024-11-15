const EquipmentType = require("../models/equipmentTypeModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");

const myS3Client = require("../utils/myS3Client");
const Auction = require("../models/auctionModel");
const Bid = require("../models/bidModel");
const QueryFunctions = require("../utils/queryFunctions");
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY,
    secretAccessKey: process.env.AWS_USER_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

// exports.deleteGSAAuctions = catchAsyncError(async (req, res, next) => {
// exports.fetchGSAAuctions = catchAsyncError(async (req, res, next) => {
exports.fetchGSAAuctions = async () => {
  try {
    const wordList = [
      "medical",
      "ultrasound",
      "patient",
      "ekg",
      "medicine",
      "vital",
      "constellation",
      "dental",
      "audiology",
      "surgical",
      "endoscope",
      "glidescope",
      "phlebotomy",
      "CPAP",
      "bariatric",
      "PAPR hood",
      "Aespire",
      "anesthesia",
      "ophthalmic",
      "Dinamap",
      "electrocardiograph",
      "fluidshield",
      "radiology",
      "medgraphics",
      "ophthalmology",
      "X-ray",
      "hemodialysis",
      "MRI",
      "incubator",
      "infusion",
      "ventilator",
      "defibrillator",
      "sterilizer",
      "microscope",
      "endoscopy",
      "suction",
      "laser",
      "pump",
      "nebulizer",
      "monitor",
      "wheelchair",
      "stretcher",
      "crutches",
      "thermometer",
      "blood pressure",
      "glucometer",
      "EXAM",
      "ULRASOUND",
      "MED-SURG",
      "HYDROCOLLATOR",
      "SHARPS CONTAINER",
      "HOSPITAL",
      "FIRST AID",
      "PROSTHETICS",
      "PRECISIONGLIDE",
      "CANNULA",
      "NEPHRO",
      "TREATMENT",
      "THERAPY",
      "MAKRITE",
      "OXYGEN",
      "ACIST",
      "SHARPS COLLECTOR",
      "MEDICATION",
      "OSCILLOSCOPES",
      "OPERATING ROOM",
      "ACUPUNCTURIST",
      "DIALYSIS",
      "TROPHON",
    ];

    const url =
      "https://api.gsa.gov/assets/gsaauctions/v2/auctions?api_key=byuZieHNwc3U4G1abYmNoALjEJphz3nTFAVpRc0p&format=JSON";

    // async function gsaAuctions() {
    // try {

    const response = await axios.get(url);
    // const respons = await axios.get("https://gsaauctions.gov/lotimages/regnA/A1QSCI23061104.jpg");

    // console.log(response);
    let obj;
    if (typeof response.data === "string") {
      // BUG: If the response is string, uncomment this:
      let str = response.data.replace(//g, "");

      str = str.replace(/\u0009/g, "");
      str = str.replace(/"s"/g, "");
      obj = JSON.parse(str);
    } else {
      obj = response.data;
    }
    // if the response is an object, use this:

    const results = [];
    // obj.Results.forEach((el) => {
    // response.data.Results.forEach((el) => {
    console.log("Processing auctions...");
    for (let i = 0; i < obj.Results.length; i++) {
      // const element = array[i];
      try {
        if (
          wordList.some((substring) =>
            obj.Results[i]["ItemName       "].toLowerCase().includes(substring.toLowerCase())
          )
        ) {
          const imageName = `${generateFileName()}.jpeg`;
          const imageBody = await axios.get(
            // "https://gsaauctions.gov/lotimages/regnA/A1QSCI23061104.jpg",
            obj.Results[i]["ImageURL       "],
            {
              responseType: "arraybuffer",
            }
          );
          // console.log(imageBody.data);
          const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: imageName,
            Body: imageBody.data,
            // ContentType: req.file.mimetype,
          };
          const command = new PutObjectCommand(params);
          await s3Client.send(command);

          // const description = response.data.Results[i]["LotInfo"]
          //   .map((el) => {
          //     return el.LotDescript;
          //   })
          //   .join(" ");

          results.push({
            name: obj.Results[i]["ItemName       "],
            startDate: obj.Results[i]["AucStartDt     "],
            endDate: obj.Results[i]["AucEndDt       "],
            image: imageName,
            currentBid: obj.Results[i]["HighBidAmount  "],
            originalId: `${obj.Results[i]["SaleNo         "]}${obj.Results[i]["LotNo          "]}`,
            // increasedPrice:
            //   response.data.Results[i]["HighBidAmount  "] +
            //   response.data.Results[i]["HighBidAmount  "] * 0.1,
            // description: description,
          });
        }
        // });
      } catch (error) {
        console.log(error.code);

        // if any error occurred due to GSA in a certain auction, continue to the next one.
        if (error.code === "ETIMEDOUT") {
          throw error;
        } else continue;
      }
    }
    console.log("bulkOperations auctions...");
    const bulkOperations = results.map((auction) => ({
      // const { name, ...updateFields } = user;
      updateOne: {
        filter: { originalId: auction.originalId },
        // update: updateFields,
        update: auction,
        upsert: true,
      },
    }));

    // await Auction.insertMany(results);
    console.log("inserting auctions...");

    await Auction.bulkWrite(bulkOperations);
    // console.log(results);

    // res.status(200).json({
    //   status: "success",
    //   results: results.length,
    //   data: results,
    //   // data: response.data,
    // });
    console.log("Auctions list was updated successfully!");
  } catch (error) {
    console.log(error);
    throw new AppError("Something went wrong fetching GSA Auctions", 400);
  }
};

exports.getAllAuctions = catchAsyncError(async (req, res, next) => {
  const queryFunctions = new QueryFunctions(Auction.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // console.log(queryFunctions.queryString);

  const auctions = await queryFunctions.query;
  // const auctions = await Auction.find().sort("-currentBid");
  for (let auction of auctions) {
    auction._doc.imageUrl = await getSignedUrl(
      myS3Client,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: auction.image,
      }),
      { expiresIn: 3600 }
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      auctions,
    },
  });
});

exports.getAuction = catchAsyncError(async (req, res, next) => {
  console.log();
  const auction = await Auction.findById(req.params.auctionId);

  console.log(auction);

  if (!auction) {
    return next(new AppError("No auction found with that ID", 404));
  }

  if (req.query.status === "Active" && auction.status === "Inactive") {
    return next(new AppError("You can't access this auction", 401));
  }

  auction._doc.imageUrl = await getSignedUrl(
    myS3Client,
    new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: auction.image,
    }),
    { expiresIn: 3600 }
  );

  res.status(200).json({
    status: "success",
    data: {
      auction,
    },
  });
});

exports.deleteAuction = catchAsyncError(async (req, res, next) => {
  const auction = await Auction.findByIdAndDelete(req.params.auctionId);

  if (!auction) {
    return next(new AppError("No auction found with that ID", 404));
  }

  const deleteParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: auction.image,
  };

  await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMultiAuction = catchAsyncError(async (req, res, next) => {
  const { deleteArray } = req.body;

  const auctions = await Auction.find({ _id: { $in: deleteArray } });

  const bids = await Bid.deleteMany({ auction: { $in: deleteArray } });

  console.log(req.body);
  console.log(auctions);

  if (!auctions.length) {
    return next(new AppError("No auctions found with that ID", 404));
  }

  const deleteDocs = await Auction.deleteMany({ _id: { $in: deleteArray } });

  const imagesToDelete = auctions.map((option) => {
    return {
      Key: option.image,
    };
  });

  if (auctions.length) {
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

exports.updateAuction = catchAsyncError(async (req, res, next) => {
  const { name, currentBid, endDate, status } = req.body;
  console.log(req.body);

  const updateObject = {
    name,
    currentBid,
    endDate,
    status,
  };

  if (req.file) {
    updateObject.image = req.file.filename;
    // consider deleting old image if new image was uploaded
  }

  const auction = await Auction.findByIdAndUpdate(req.params.auctionId, updateObject, {
    // new: true,
    runValidators: true,
  });

  if (!auction) {
    return next(new AppError("No auction found with that ID", 404));
  }

  console.log(auction.image, updateObject.image);

  const deleteParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: auction.image,
  };

  await myS3Client.send(new DeleteObjectCommand(deleteParams));

  res.status(200).json({
    status: "success",
    data: {
      auction,
    },
  });
});

const schedule = require("node-schedule");

const catchAsyncError = require("../utils/catchAsyncError");
const auctionController = require("../controllers/auctionController");
// const emailsScheduledFunctions = require("../jobs/emailsScheduledFunctions");
// const ScheduledJob = require("../models/scheduledJobModel");
const AppError = require("../utils/appError");
const QueryFunctions = require("../utils/queryFunctions");
const Job = require("../models/jobModel");
const PerformanceSnapshot = require("../models/performanceSnapshotModel");
const Auction = require("../models/auctionModel");
const EquipmentModel = require("../models/equipmentModelModel");
const Bid = require("../models/bidModel");
const Quote = require("../models/quoteModel");

// let anomalyDetectionJobs = [];
let scheduledJob;

exports.prepareScheduledJob = () => {
  let recRule = new schedule.RecurrenceRule();

  recRule.hour = 0;
  recRule.minute = 0;
  recRule.tz = "Asia/Riyadh";
  // recRule.minute = new schedule.Range(0, 59);

  scheduledJob = schedule.scheduleJob(recRule, async () => {
    try {
      const startTimeInMs = Date.now();
      await auctionController.fetchGSAAuctions();
      await Job.create({
        lastRunTimestamp: Date.now(),
        lastRunDurationInMs: Date.now() - startTimeInMs,
      });
    } catch (error) {
      console.log(error);
    }
  });

  const monthly = new schedule.RecurrenceRule();
  monthly.month = new schedule.Range(0, 11);
  monthly.date = -1;
  monthly.hour = 0;
  monthly.minute = 0;
  monthly.second = 0;
  // monthly.minute = new schedule.Range(0, 59);

  schedule.scheduleJob(monthly, async () => {
    console.log("Performance snapshot ");
    // take a snapshot of Auctions, Models, Bids, Quote Requests
    const auctions = await Auction.find();
    const models = await EquipmentModel.find();
    const bids = await Bid.find();
    const quoteRequests = await Quote.find();
    await PerformanceSnapshot.create({
      noOfAuctions: auctions.length,
      noOfModels: models.length,
      noOfBids: bids.length,
      noOfQuoteRequests: quoteRequests.length,
    });
    // await PerformanceSnapshot.create({
    //   noOfAuctions: Math.floor(Math.random() * 10000) + 1,
    //   noOfModels: Math.floor(Math.random() * 10000) + 1,
    //   noOfBids: Math.floor(Math.random() * 10000) + 1,
    //   noOfQuoteRequests: Math.floor(Math.random() * 10000) + 1,
    // });
  });
};

// const fetchGSAAuctions = () => {};
exports.invokeJob = catchAsyncError(async (req, res, next) => {
  // delete job from the database
  // const job = await ScheduledJob.findById(jobId);
  try {
    // console.log("SDAFSAF");
    // await scheduledJob.invoke();
    const startTimeInMs = Date.now();
    await auctionController.fetchGSAAuctions();
    await Job.create({
      lastRunTimestamp: Date.now(),
      lastRunDurationInMs: Date.now() - startTimeInMs,
    });
  } catch (error) {
    throw new AppError("Something went wrong fetching GSA Auctions", 400);
  }
  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.getLatestJob = catchAsyncError(async (req, res, next) => {
  const job = await Job.find().sort("-lastRunTimestamp").limit(1);

  res.status(200).json({
    status: "success",
    data: { job },
  });
});

exports.getPerformanceSnapshots = catchAsyncError(async (req, res, next) => {
  const performanceSnapshots = await PerformanceSnapshot.find().sort("-createdAt").limit(12);

  res.status(200).json({
    status: "success",
    data: { performanceSnapshots },
  });
});

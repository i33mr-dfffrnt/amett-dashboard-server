const mongoose = require("mongoose");

const performanceSnapshotSchema = mongoose.Schema(
  {
    noOfAuctions: {
      type: Number,
    },
    noOfModels: {
      type: Number,
    },
    noOfBids: {
      type: Number,
    },
    noOfQuoteRequests: {
      type: Number,
    },
  },
  { timestamps: true }
);

const PerformanceSnapshot = mongoose.model("PerformanceSnapshot", performanceSnapshotSchema);
module.exports = PerformanceSnapshot;

const mongoose = require("mongoose");

const jobSchema = mongoose.Schema({
  lastRunTimestamp: {
    type: Date,
  },

  lastRunDurationInMs: {
    type: Number,
  },
});

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;

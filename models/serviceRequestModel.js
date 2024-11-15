const mongoose = require("mongoose");

const serviceRequestSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "A service request must have a name"],
  },
  email: {
    type: String,
    required: [true, "A service request must have a email"],
  },
  serviceType: {
    type: String,
    required: [true, "A service request must have a serviceType"],
  },
  deviceType: {
    type: String,
    required: [true, "A service request must have a deviceType"],
  },
  deviceManufacturer: {
    type: String,
    required: [true, "A service request must have a deviceManufacturer"],
  },
  serialNo: {
    type: String,
    required: [true, "A service request must have a serialNo"],
  },
  deviceLocation: {
    type: String,
    required: [true, "A service request must have a deviceLocation"],
  },
  deviceSite: {
    type: String,
    required: [true, "A service request must have a deviceSite"],
  },
  problemDescription: {
    type: String,
    required: [true, "A service request must have a problemDescription"],
  },
  status: {
    type: String,
    enum: ["Accepted", "Pending"],
  },
  assignedEmployee: {
    type: mongoose.Schema.ObjectId,
    ref: "Employee",
  },
  notes: {
    type: String,
  },
});

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);
module.exports = ServiceRequest;

const mongoose = require("mongoose");
const Bid = require("./bidModel");

const auctionSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "A auction must have a name"],
  },
  originalId: {
    type: String,
    required: [true, "A auction must have an id"],
    unique: true,
  },
  description: {
    type: String,
    // required: [true, "A auction must have a description"],
  },
  image: {
    type: String,
    required: [true, "auction must have an image"],
    trim: true,
  },
  currentBid: {
    type: Number,
    required: [true, "auction must have a currentBid"],
  },
  endDate: {
    type: Date,
    required: [true, "auction must have an endDate"],
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
});

// auctionSchema.index({
//   name: "text",
//   description: "text",
//   // manufacturer: "text",
//   // type: "text",
// });

auctionSchema.post("findOneAndDelete", async function (doc) {
  console.log("doc._id", doc._id);
  const bids = await Bid.deleteMany({ auction: doc._id });
});

const Auction = mongoose.model("Auction", auctionSchema);

module.exports = Auction;

const mongoose = require("mongoose");

const bidSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A bid must have a name"],
    },
    email: {
      type: String,
      required: [true, "A bid must have an email"],
    },
    bid: {
      type: Number,
      required: [true, "A bid request must have a bid"],
    },
    message: {
      type: String,
      required: [true, "A bid must have a message"],
    },
    auction: {
      type: mongoose.Schema.ObjectId,
      ref: "Auction",
      required: [true, "A bid must have an auctionId"],
    },
    auctionName: {
      type: String,
      required: [true, "A bid must have an auctionName"],
    },
  },
  { timestamps: true }
);

const Bid = mongoose.model("Bid", bidSchema);

module.exports = Bid;

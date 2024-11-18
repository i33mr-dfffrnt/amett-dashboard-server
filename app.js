const express = require("express");
const globalErrorHandler = require("./controllers/errorController");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
var xss = require("xss-clean");
const hpp = require("hpp");

const equipmentTypeRouter = require("./routes/equipmentTypeRoutes");
const equipmentManufacturerRoutes = require("./routes/equipmentManufacturerRoutes");
const equipmentModelRoutes = require("./routes/equipmentModelRoutes");
const adminRouter = require("./routes/adminRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const jobRouter = require("./routes/jobRoutes");
const bidRouter = require("./routes/bidRoutes");
const serviceRouter = require("./routes/serviceRoutes");
const empRouter = require("./routes/empRoutes");

const jobController = require("./controllers/jobController");

const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: ["https://www.amett.net", "https://amett.net", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({}));

// Add the headers middleware

app.use(helmet());

// Data sanitization against NoSQL query injection

app.use(mongoSanitize());

// Data sanitization against XXS
app.use(xss());

// Prevent parameter pollution using hpp package
app.use(
  hpp({
    whitelist: ["auction", "model", "status", "type", "manufacturer"],
  })
);

const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use(limiter);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/auth", adminRouter);
app.use("/equipment-types", equipmentTypeRouter); // collection
app.use("/equipment-manufacturers", equipmentManufacturerRoutes);  
app.use("/equipment-models", equipmentModelRoutes); // product4
app.use("/quotes", quoteRoutes);
app.use("/auctions", auctionRoutes);
app.use("/jobs", jobRouter);
app.use("/bids", bidRouter);
app.use("/service", serviceRouter);
app.use("/employees", empRouter);

jobController.prepareScheduledJob();

app.use(globalErrorHandler);

// app.listen(PORT, (error) => {
//   if (!error) console.log("Server is Successfully Running,				and App is listening on port " + PORT);
//   else console.log("Error occurred, server can't start", error);
// });

module.exports = app;

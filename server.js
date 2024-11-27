const mongoose = require("mongoose");
const dotenv = require("dotenv");

// uncaughtException goes here
process.on("uncaughtException", (err) => {
  console.log("UNHANDLED EXCEPTION! Shutting down...");
  console.log(err);
  console.log(err.name, err.message);
  process.exit(1);
});


dotenv.config({ path: "./config.env" });

const app = require("./app");
const DB = process.env.DATABASE.replace("<DATABASE_NAME>", process.env.DATABASE_NAME);

mongoose
  .connect(DB, {
    // to avoid deprecation
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,

    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful"));

const port = process.env.PORT || 5050;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// global unhandled rejections handler
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Sick term is an event that emitted by heroku to restart the app every 24h
// So we need to respond to it. (like the unhandled rejection above)
process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully!");
  server.close(() => {
    console.log("Process terminated");
  });
});

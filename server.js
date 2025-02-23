const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Route files
const auth = require("./routes/auth");
const dentists = require("./routes/dentists");
const appointments = require("./routes/appointments");

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Mount routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/dentists", dentists);
app.use("/api/v1/appointments", appointments);

const PORT = process.env.PORT || 5003;
const server = app.listen(
  PORT,
  console.log(
    "Server running in ",
    process.env.NODE_ENV,
    " mode on port ",
    PORT,
  ),
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  // Graceful shutdown
  server.close(() => {
    throw new Error("Server closed due to unhandled promise rejection");
  });
});

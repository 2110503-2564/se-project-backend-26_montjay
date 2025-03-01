const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");

// Route files
const auth = require("./routes/auth");
const dentists = require("./routes/dentists");
const bookings = require("./routes/bookings");

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

app.use(helmet());
app.use(xss());
//Rate Limiting
const limiter = rateLimit({
  windowsMs: 10 * 60 * 1000, //10 mins
  max: 100,
});
app.use(limiter);

// Mount routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/dentists", dentists);
app.use("/api/v1/bookings", bookings);

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

const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const cors = require("cors");

const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Route files
const auth = require("./routes/auth");
const dentists = require("./routes/dentists");
const bookings = require("./routes/bookings");
const comments = require("./routes/comments");
const offHours = require("./routes/offHours");
const { version } = require("mongoose");

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
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
//Rate Limiting
const limiter = rateLimit({
  windowsMs: 10 * 60 * 1000, //10 mins
  max: 100,
});
app.use(limiter);

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Dentist Booking API",
      version: "1.0.0",
      description: "API for a dental appointment booking system",
      contact: {
        name: "Developer"
      },
      servers: [
        {
          url: process.env.HOST ? `${process.env.HOST}:${process.env.PORT || 5003}` : "http://localhost:5003"
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: [
    "./routes/*.js" // Path to the API docs
  ]
};

// Initialize swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Add a simple route to redirect to API docs
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// Mount routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/dentists", dentists);
app.use("/api/v1/bookings", bookings);
app.use("/api/v1/comments", comments);
app.use("/api/v1/offHours", offHours);

const PORT = process.env.PORT || 5003;
const server = app.listen(
  PORT,
  console.log(
    "Server running in ",
    process.env.NODE_ENV,
    `on ${process.env.HOST || "http://localhost"}:${PORT}`,
    "\nAPI Documentation available at /api-docs"
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
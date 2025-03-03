const express = require("express");
const {
  getBookings,
  getBooking,
  addBooking,
  updateBooking,
  deleteBooking
} = require("../controllers/bookings");

const router = express.Router({ mergeParams: true }); 

const { protect, authorize } = require("../middleware/auth");

// Route for getting and adding bookings
router.route("/").get(protect, getBookings).post(protect, authorize("admin", "user"), addBooking); // Add new booking

// Route for getting, updating, and deleting a specific booking by its ID
router.route("/:id").get(protect, getBooking).put(protect, authorize("admin", "user"), updateBooking).delete(protect, authorize("admin", "user"), deleteBooking); 

module.exports = router;
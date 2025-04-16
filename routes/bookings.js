const express = require("express");
const {
  getBookings,
  getBooking,
  addBooking,
  updateBooking,
  deleteBooking,
  getUnavailableBooking,
  getUnavailableBookingByDentID
} = require("../controllers/bookings");

const router = express.Router({ mergeParams: true }); 

const { protect, authorize } = require("../middleware/auth");

// Route for getting and adding bookings
router.route("/")
  .get(protect, (req, res, next) => {
    if (req.baseUrl.includes("unavailable")) {
      return getUnavailableBookingByDentID(req, res, next);
    }
    return getBookings(req, res, next);
  })
  .post(protect, authorize("admin", "user", "dentist"), addBooking);

// Route for getting all unavailable bookings (admin only)
router.route("/unavailable")
  .get(protect, authorize("admin", "dentist"), getUnavailableBooking);

// Route for getting, updating, and deleting a specific booking by its ID
router.route("/:id")
  .get(protect, getBooking)
  .put(protect, authorize("admin", "user", "dentist"), updateBooking)
  .delete(protect, authorize("admin", "user", "dentist"), deleteBooking); 

module.exports = router;
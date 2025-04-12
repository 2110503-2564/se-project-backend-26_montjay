const express = require("express");
const {
  getBookings,
  getBooking,
  addBooking,
  updateBooking,
  deleteBooking,
  getUnavailableBooking
} = require("../controllers/bookings");

const router = express.Router({ mergeParams: true }); 

const { protect, authorize } = require("../middleware/auth");

// Route for getting and adding bookings
router.route("/")
  .get(protect, (req, res, next) => {
    if (req.baseUrl.includes("unavailable")) {
      return getUnavailableBooking(req, res, next);
    }
    return getBookings(req, res, next);
  })
  .post(protect, authorize("admin", "user"), addBooking);

// Route for getting, updating, and deleting a specific booking by its ID
router.route("/:id")
  .get(protect, getBooking)
  .put(protect, authorize("admin", "user"), updateBooking)
  .delete(protect, authorize("admin", "user"), deleteBooking); 

module.exports = router;
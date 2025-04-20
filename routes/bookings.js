const express = require("express");
const {
  getBookings,
  getBooking,
  addBooking,
  updateBooking,
  deleteBooking,
  getAllDentistSchedules
} = require("../controllers/bookings");

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route("/")
  .get(protect, (req, res, next) => {
    return getBookings(req, res, next);
  })
  .post(protect, authorize("admin", "user", "dentist"), addBooking);

router.route("/schedules")
  .get(protect, authorize("admin"), getAllDentistSchedules);

router.route("/:id")
  .get(protect, getBooking)
  .put(protect, authorize("admin", "user", "dentist"), updateBooking)
  .delete(protect, authorize("admin", "user", "dentist"), deleteBooking);

module.exports = router;
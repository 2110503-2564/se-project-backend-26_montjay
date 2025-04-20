const express = require("express");
const {
  getOffHours,
  getOffHour,
  updateOffHour,
  deleteOffHour,
  addOffHour,
  getOffHoursByOwnerId
} = require("../controllers/offHours");

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(protect, getOffHours).post(protect, authorize("admin", "dentist"), addOffHour);

router.route("/:id").get(protect, getOffHour).put(protect, authorize("admin", "dentist"), updateOffHour).delete(protect, authorize("admin", "dentist"), deleteOffHour);

router.route("/owner/:ownerId").get(protect, getOffHoursByOwnerId);

module.exports = router;
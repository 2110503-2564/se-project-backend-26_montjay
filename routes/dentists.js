const express = require("express");
const {
  getDentists,
  getDentist,
  createDentist,
  updateDentist,
  deleteDentist,
} = require("../controllers/dentists");

const router = express.Router();

const bookingRouter = require("./bookings");

const commentRouter = require('./comments');

const { protect, authorize } = require("../middleware/auth");

router.use("/:dentistId/unavailable", bookingRouter);

router.use("/:dentistId/bookings/", bookingRouter);

router.use("/:dentistId/comments/", commentRouter);

router
  .route("/")
  .get(getDentists)
  .post(protect, authorize("admin"), createDentist);
router
  .route("/:id")
  .get(getDentist)
  .put(protect, authorize("admin"), updateDentist)
  .delete(protect, authorize("admin"), deleteDentist);

module.exports = router;

const express = require("express");
const {
  getBookings,
  getBooking,
  addBooking,
  updateBooking,
  deleteBooking,
  getAllDentistSchedules,
  getBookingsForDentist
} = require("../controllers/bookings");

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - apptDateAndTime
 *         - user
 *         - dentist
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the booking
 *         apptDateAndTime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the appointment
 *         user:
 *           type: string
 *           description: Reference to the user who made the booking
 *         dentist:
 *           type: string
 *           description: Reference to the dentist for the appointment
 *         isUnavailable:
 *           type: boolean
 *           description: Flag to mark the time slot as unavailable
 *           default: false
 *         status:
 *           type: string
 *           enum: [Booked, Cancel]
 *           default: Booked
 *           description: Status of the booking
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the booking was created
 */

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Dental appointment booking API
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get all bookings
 *     description: Retrieve all bookings ( users get their own, admins get all or filtered by dentist )
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Success - List of bookings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 * 
 *   post:
 *     summary: Create a new booking
 *     description: Create a new dental appointment booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apptDateAndTime
 *               - dentist
 *             properties:
 *               apptDateAndTime:
 *                 type: string
 *                 format: date-time
 *               dentist:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid input or time slot not available
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/bookings/schedules:
 *   get:
 *     summary: Get all dentists' schedules
 *     description: Admin only - Get schedules of all dentists
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (default is current date)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (default is 30 days ahead)
 *     responses:
 *       200:
 *         description: Success - List of dentist schedules retrieved
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not an admin
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/bookings/dentist:
 *   get:
 *     summary: Get bookings for dentist
 *     description: Get bookings based on user role (dentist sees own bookings)
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Success - List of bookings retrieved
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get a single booking
 *     description: Retrieve details of a specific booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Success - Booking details retrieved
 *       400:
 *         description: Invalid booking ID format
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 * 
 *   put:
 *     summary: Update a booking
 *     description: Modify an existing booking (authorization required)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apptDateAndTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [Booked, Cancel]
 *               isUnavailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not authorized to update this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 * 
 *   delete:
 *     summary: Delete a booking
 *     description: Remove a booking (authorization required)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not authorized to delete this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route("/")
  .get(protect, (req, res, next) => {
    return getBookings(req, res, next);
  })
  .post(protect, authorize("admin", "user", "dentist"), addBooking);

router.route("/schedules")
  .get(protect, authorize("admin"), getAllDentistSchedules);

router.route("/dentist")
  .get(protect, authorize("admin", "dentist"), getBookingsForDentist);

router.route("/:id")
  .get(protect, getBooking)
  .put(protect, authorize("admin", "user", "dentist"), updateBooking)
  .delete(protect, authorize("admin", "user", "dentist"), deleteBooking);

module.exports = router;
const express = require("express");
const {
  getDentists,
  getDentist,
  getDentistDetail,
  createDentist,
  updateDentist,
  deleteDentist,
} = require("../controllers/dentists");

/**
 * @swagger
 * components:
 *   schemas:
 *     Dentist:
 *       type: object
 *       required:
 *         - user
 *         - yearsOfExperience
 *         - areaOfExpertise
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the dentist
 *         user:
 *           type: string
 *           description: Reference to user account of the dentist
 *         yearsOfExperience:
 *           type: number
 *           description: Years of professional experience
 *           minimum: 0
 *         areaOfExpertise:
 *           type: array
 *           items:
 *             type: string
 *             enum: [Orthodontics, Pediatric Dentistry, Endodontics, Prosthodontics, Periodontics, Oral Surgery, General Dentistry]
 *           description: Dentist's specializations
 */

/**
 * @swagger
 * tags:
 *   name: Dentists
 *   description: Dentist management API
 */

/**
 * @swagger
 * /api/v1/dentists:
 *   get:
 *     summary: Get all dentists
 *     description: Retrieve a list of all dentists with optional filtering
 *     tags: [Dentists]
 *     parameters:
 *       - in: query
 *         name: areaOfExpertise
 *         schema:
 *           type: string
 *         description: Filter by area of expertise
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: Select specific fields (comma separated)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by fields (comma separated)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of dentists retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *
 *   post:
 *     summary: Create a dentist
 *     description: Create a new dentist profile (admin only)
 *     tags: [Dentists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - yearsOfExperience
 *               - areaOfExpertise
 *             properties:
 *               user:
 *                 type: string
 *               yearsOfExperience:
 *                 type: number
 *                 minimum: 0
 *               areaOfExpertise:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Orthodontics, Pediatric Dentistry, Endodontics, Prosthodontics, Periodontics, Oral Surgery, General Dentistry]
 *     responses:
 *       201:
 *         description: Dentist created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/v1/dentists/detail/{dentID}:
 *   get:
 *     summary: Get detailed dentist info
 *     description: Retrieve detailed information about a dentist including appointments, comments, and off hours
 *     tags: [Dentists]
 *     parameters:
 *       - in: path
 *         name: dentID
 *         required: true
 *         schema:
 *           type: string
 *         description: Dentist ID
 *     responses:
 *       200:
 *         description: Dentist details retrieved successfully
 *       404:
 *         description: Dentist not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/dentists/{id}:
 *   get:
 *     summary: Get a single dentist
 *     description: Retrieve details of a specific dentist
 *     tags: [Dentists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dentist ID
 *     responses:
 *       200:
 *         description: Dentist details retrieved successfully
 *       400:
 *         description: Invalid dentist ID
 *
 *   put:
 *     summary: Update a dentist
 *     description: Modify an existing dentist profile (admin or the dentist only)
 *     tags: [Dentists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dentist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               yearsOfExperience:
 *                 type: number
 *                 minimum: 0
 *               areaOfExpertise:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Orthodontics, Pediatric Dentistry, Endodontics, Prosthodontics, Periodontics, Oral Surgery, General Dentistry]
 *     responses:
 *       200:
 *         description: Dentist updated successfully
 *       400:
 *         description: Invalid input or dentist not found
 *       401:
 *         description: Not authorized
 *
 *   delete:
 *     summary: Delete a dentist
 *     description: Remove a dentist profile and related bookings (admin only)
 *     tags: [Dentists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dentist ID
 *     responses:
 *       200:
 *         description: Dentist deleted successfully
 *       400:
 *         description: Invalid dentist ID or deletion failed
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Dentist not found
 */

/**
 * @swagger
 * /api/v1/dentists/{dentistId}/bookings:
 *   get:
 *     summary: Get bookings for a dentist
 *     description: Retrieve all bookings for a specific dentist
 *     tags: [Dentists]
 *     parameters:
 *       - in: path
 *         name: dentistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dentist ID
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/v1/dentists/{dentistId}/unavailable:
 *   post:
 *     summary: Mark timeslot as unavailable
 *     description: Create an unavailable time slot for a dentist
 *     tags: [Dentists]
 *     parameters:
 *       - in: path
 *         name: dentistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dentist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apptDateAndTime
 *             properties:
 *               apptDateAndTime:
 *                 type: string
 *                 format: date-time
 *               isUnavailable:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Unavailable time slot created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */

const router = express.Router();

const bookingRouter = require("./bookings");
const commentRouter = require("./comments");

const { protect, authorize } = require("../middleware/auth");

router.use("/:dentistId/unavailable", bookingRouter);
router.use("/:dentistId/bookings", bookingRouter);
router.use("/:dentistId/comments", commentRouter);

router
  .route("/")
  .get(getDentists)
  .post(protect, authorize("admin"), createDentist);

router
  .route("/detail/:dentID")
  .get(getDentistDetail)

router
  .route("/:id")
  .get(getDentist)
  .put(protect, authorize("admin", "dentist"), updateDentist)
  .delete(protect, authorize("admin"), deleteDentist);

module.exports = router;
const express = require("express");
const {
  getOffHours,
  getOffHour,
  updateOffHour,
  deleteOffHour,
  addOffHour,
  getOffHoursByOwnerId
} = require("../controllers/offHours");

/**
 * @swagger
 * components:
 *   schemas:
 *     OffHour:
 *       type: object
 *       required:
 *         - owner
 *         - startDate
 *         - endDate
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the off-hour period
 *         owner:
 *           type: string
 *           description: Reference to the user (dentist) who owns this off-hour period
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date and time of the off-hour period
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date and time of the off-hour period
 *         description:
 *           type: string
 *           description: Reason or description for the off-hour period
 *         isForAllDentist:
 *           type: boolean
 *           default: false
 *           description: Whether this off-hour period applies to all dentists
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the off-hour period was created
 */

/**
 * @swagger
 * tags:
 *   name: OffHours
 *   description: Dentist unavailability management
 */

/**
 * @swagger
 * /api/v1/offHours:
 *   get:
 *     summary: Get all off-hours
 *     description: Retrieve all off-hour periods
 *     tags: [OffHours]
 *     responses:
 *       200:
 *         description: List of off-hour periods retrieved successfully
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
 *                     $ref: '#/components/schemas/OffHour'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 *   
 *   post:
 *     summary: Add off-hour period
 *     description: Create a new off-hour period for a dentist or all dentists
 *     tags: [OffHours]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               owner:
 *                 type: string
 *                 description: User ID (defaults to current user if not provided)
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               isForAllDentist:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Off-hour period created successfully
 *       400:
 *         description: Invalid input or dates
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/offHours/owner/{ownerId}:
 *   get:
 *     summary: Get off-hours by owner
 *     description: Retrieve all off-hour periods for a specific dentist
 *     tags: [OffHours]
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner (dentist) ID
 *     responses:
 *       200:
 *         description: List of off-hour periods retrieved successfully
 *       400:
 *         description: Invalid owner ID format
 *       404:
 *         description: No off-hours found for this owner
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/offHours/{id}:
 *   get:
 *     summary: Get a single off-hour period
 *     description: Retrieve details of a specific off-hour period
 *     tags: [OffHours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Off-hour ID
 *     responses:
 *       200:
 *         description: Off-hour period details retrieved successfully
 *       400:
 *         description: Invalid off-hour ID format
 *       404:
 *         description: Off-hour period not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update an off-hour period
 *     description: Modify an existing off-hour period (only owner or admin)
 *     tags: [OffHours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Off-hour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               isForAllDentist:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Off-hour period updated successfully
 *       401:
 *         description: Not authorized to update this off-hour period
 *       404:
 *         description: Off-hour period not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete an off-hour period
 *     description: Remove an off-hour period (only owner or admin)
 *     tags: [OffHours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Off-hour ID
 *     responses:
 *       200:
 *         description: Off-hour period deleted successfully
 *       401:
 *         description: Not authorized to delete this off-hour period
 *       404:
 *         description: Off-hour period not found
 *       500:
 *         description: Server error
 */

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(protect, getOffHours).post(protect, authorize("admin", "dentist"), addOffHour);

router.route("/:id").get(protect, getOffHour).put(protect, authorize("admin", "dentist"), updateOffHour).delete(protect, authorize("admin", "dentist"), deleteOffHour);

router.route("/owner/:ownerId").get(protect, getOffHoursByOwnerId);

module.exports = router;
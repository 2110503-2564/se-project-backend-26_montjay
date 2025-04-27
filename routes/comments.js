const express = require("express");
const {
  getComments,
  getComment,
  updateComment,
  deleteComment,
  addComment,
  getCommentsByDentId
} = require("../controllers/comments");

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - user
 *         - dentist
 *         - comment
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the comment
 *         user:
 *           type: string
 *           description: Reference to user who made the comment
 *         dentist:
 *           type: string
 *           description: Reference to dentist being commented on
 *         comment:
 *           type: string
 *           description: Comment text
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the comment was created
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Dentist reviews and comments
 */

/**
 * @swagger
 * /api/v1/comments:
 *   get:
 *     summary: Get all comments
 *     description: Retrieve all comments (filtered by user role)
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: List of comments retrieved successfully
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
 *                     $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 *   
 *   post:
 *     summary: Add a comment
 *     description: Create a new comment for a dentist
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dentist
 *               - comment
 *             properties:
 *               dentist:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid input or already commented
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/comments/dentist:
 *   get:
 *     summary: Get comments by dentist
 *     description: Get comments filtered by dentist ID
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: dentistId
 *         schema:
 *           type: string
 *         description: Dentist ID to filter comments (admin only)
 *     responses:
 *       200:
 *         description: List of comments for dentist retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   get:
 *     summary: Get a single comment
 *     description: Retrieve a specific comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment details retrieved successfully
 *       400:
 *         description: Invalid comment ID format
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a comment
 *     description: Modify an existing comment (only owner or admin)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Not authorized to update this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a comment
 *     description: Remove a comment (only owner or admin)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/dentists/{dentistId}/comments:
 *   get:
 *     summary: Get comments for a specific dentist
 *     description: Retrieve all comments for a dentist by dentist ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: dentistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dentist ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Dentist not found
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Add comment for a specific dentist
 *     description: Create a new comment for a specific dentist
 *     tags: [Comments]
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
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid input or already commented
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Dentist not found
 *       500:
 *         description: Server error
 */

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route("/")
  .get(protect, getComments)
  .post(protect, authorize("admin", "user"), addComment);
router.route("/dentist")
  .get(protect, getCommentsByDentId);
router.route("/:id")
  .get(protect, getComment)
  .put(protect, authorize("admin", "user"), updateComment)
  .delete(protect, authorize("admin", "user"), deleteComment);

module.exports = router;
const express = require("express");
const {
    register,
    registerDentist,
    login, logout,
    getMe,
    updateUser
} = require("../controllers/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - tel
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: User's full name
 *         tel:
 *           type: string
 *           description: User's telephone number
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [user, admin, dentist]
 *           default: user
 *           description: User's role
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the user was created
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication API
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - tel
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               tel:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin, dentist]
 *     responses:
 *       200:
 *         description: User registered and token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /api/v1/auth/registerDent:
 *   post:
 *     summary: Register new dentist
 *     description: Create a new dentist account (admin only)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - tel
 *               - yearsOfExperience
 *               - areaOfExpertise
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               tel:
 *                 type: string
 *               role:
 *                 type: string
 *                 default: dentist
 *               yearsOfExperience:
 *                 type: number
 *               areaOfExpertise:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum:
 *                     - Orthodontics
 *                     - Pediatric Dentistry
 *                     - Endodontics
 *                     - Prosthodontics
 *                     - Periodontics
 *                     - Oral Surgery
 *                     - General Dentistry
 *     responses:
 *       200:
 *         description: Dentist registered and token generated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful with JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   get:
 *     summary: Logout user
 *     description: Clear cookie and blacklist token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       400:
 *         description: No active session found
 *       500:
 *         description: Server error during logout
 */

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the profile of currently logged in user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/v1/auth/updateUser/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user profile (admin can update any user, users can update themselves)
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               tel:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Failed to update user
 *       401:
 *         description: Not authorized to update this user
 *       500:
 *         description: Server error
 */

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router.post("/register", register);
router.post("/registerDent", protect, authorize("admin"), registerDentist);
router.post("/login", login);
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/updateUser/:id", protect, authorize("admin", "user"), updateUser);

module.exports = router;

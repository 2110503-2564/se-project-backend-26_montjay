const express = require("express");
const {
  getComments,
  getComment,
  updateComment,
  deleteComment,
  addComment
} = require("../controllers/comments");

const router = express.Router({ mergeParams: true }); 

const { protect, authorize } = require("../middleware/auth");

// Route for getting and adding comments
router.route("/").get(protect, getComments).post(protect, authorize("admin", "user"), addComment);

// Route for getting, updating, and deleting a specific comment by its ID
router.route("/:id").get(protect, getComment).put(protect, authorize("admin", "user"), updateComment).delete(protect, authorize("admin", "user"), deleteComment); 

module.exports = router;
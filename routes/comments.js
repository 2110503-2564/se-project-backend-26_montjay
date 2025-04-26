const express = require("express");
const {
  getComments,
  getComment,
  updateComment,
  deleteComment,
  addComment,
  getCommentsByDentId
} = require("../controllers/comments");

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(protect, getComments).post(protect, authorize("admin", "user"), addComment);

router.route("/dentist").get(protect, getCommentsByDentId);

router.route("/:id").get(protect, getComment).put(protect, authorize("admin", "user"), updateComment).delete(protect, authorize("admin", "user"), deleteComment);

module.exports = router;
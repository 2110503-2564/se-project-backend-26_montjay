const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Dentist = require("../models/Dentist");

//@desc     Get all Comments
//@route    GET /api/v1/comments
//@access   Public
exports.getComments = async (req, res) => {
  const query = Comment.find()
    .populate({
      path: "user",
      select: "name",
    });
  try {
    const comments = await query;
    res
      .status(200)
      .json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Booking" });
  }
};

//@desc     Get all Comments by dentistId
//@route    GET /api/v1/comments/dentist/?dentistId
//@access   Public
exports.getCommentsByDentId = async (req, res, next) => {
  let query;

  if (req.query.dentistId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.dentistId)) {
      return res.status(400).json({ success: false, message: "Invalid dentistId format" });
    }

    console.log("Fetching comments for Dentist ID:", req.query.dentistId);
    query = Comment.find({ dentist: req.query.dentistId })
      .populate({
        path: "user",
        select:"name"
      })
    }
  else {
    query = Comment.find()
      .populate({
        path: "user",
        select:"name"
      })
  }

  try {
    const comments = await query;
    console.log("comments:", comments);
    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ success: false, message: "Cannot find comments" });
  }
};

//@desc     Get one Comment
//@route    GET /api/v1/comments/:id
//@access   Private
exports.getComment = async (req, res, _next) => {
  try {
    console.log("Request Params ID:", req.params.id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Comment ID format" });
    }

    const comment = await Comment.findById(req.params.id).populate({
      path: "user",
      select: "name",
    });

    console.log("Fetched Booking:", comment);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: `No comment found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find comment" });
  }
};

//@desc     Add Comment
//@route    POST /api/v1/dentists/dentID/comments
//@access   Private
exports.addComment = async (req, res, next) => {
  try {
    // Get user ID from request body
    const userId = req.body.user || req.user.id;
    const dentistId = req.body.dentist;

    // Validate dentist ID
    if (!dentistId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a dentist ID in the request body",
      });
    }

    // Check if dentist exists
    const dentist = await Dentist.findById(dentistId);
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: `No dentist found with the ID ${dentistId}`,
      });
    }

    // Ensure user ID is correctly assigned
    req.body.user = userId;

    // Check for existing bookings by the user
    const existComment = await Comment.findOne({
      user: userId,
      dentist: dentistId,
    });

    // Restrict non-admin users to one booking
    if (existComment && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${userId} is limited to one comment in this dentist.`,
      });
    }

    // Create the booking with the correct owner
    const comment = await Comment.create(req.body);

    // Return success response
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ success: false, message: "Cannot create comment" });
  }
};

//@desc     Update comment
//@route    PUT /api/v1/comments/:id
//@access   Private
exports.updateComment = async (req, res, _next) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: `No comment with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this comment`,
      });
    }

    comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot update comment" });
  }
};

//@desc     Delete comment
//@route    DELETE /api/v1/comments/:id
//@access   Private
exports.deleteComment = async (req, res, _next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: `No comment with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this comment`,
      });
    }

    await comment.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot delete comment" });
  }
};

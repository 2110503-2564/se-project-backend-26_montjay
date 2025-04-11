const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Dentist = require("../models/Dentist");

//@desc     Get all Comments
//@route    GET /api/v1/comment
//@access   Public
exports.getComments = async (req, res, next) => {
  if (!req.params.dentistId) return;
  let query = Comment.find({ dentist: req.params.dentistId })
    .populate({
      path: "dentist",
      select: "name yearsOfExperience areaOfExpertise validate tel",
    })
  try {
    const comments = await query;
    res.status(200).json({ success: true, count: comments.length, data: comments });
  } 
  catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ success: false, message: "Cannot find Booking" });
  }
};


//@desc     Get one Comment
//@route    GET /api/v1/comment/:id
//@access   Private
exports.getComment = async (req, res, _next) => {
  try {
    console.log("Request Params ID:", req.params.id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Comment ID format" });
    }

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(req.params.id);

    // Query database
    const comment = await Comment.findOne({ id: objectId }).populate({
      path: "dentist",
      select: "name yearsOfExperience areaOfExpertise validate tel",
    });

    console.log("Fetched Booking:", comment);

    if (!comment) {
      return res.status(404).json({ success: false, message: `No comment found with ID ${req.params.id}` });
    }

    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({ success: false, message: "Cannot find comment" });
  }
};

//@desc     Add Comment
//@route    POST /api/v1/dentID/comment
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
      user: req.user.id, 
      dentist: req.body.dentistId  
    });

    // Restrict non-admin users to one booking
    if (existComment && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${userId} is limited to one comment in this dentist.`,
      });
    }

    const apptDate = new Date(req.body.apptDate);
    console.log("Normalized apptDate:", apptDate);

    // Create the booking with the correct owner
    const comment = await Comment.create(req.body);

    // Return success response
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ success: false, message: "Cannot create comment" });
  }
};

//@desc     Update commend
//@route    PUT /api/v1/commends/:id
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
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
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
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
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

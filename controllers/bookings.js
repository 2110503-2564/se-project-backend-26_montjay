const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Dentist = require("../models/Dentist");

//@desc     Get all bookings
//@route    GET /api/v1/bookings
//@access   Public
exports.getBookings = async (req, res, next) => {
  let query;

  // General users can only see their own bookings
  if (req.user.role !== "admin") {
    query = Booking.find({ user: req.user.id })
      .populate({
        path: "dentist",
        select: "name yearsOfExperience areaOfExpertise validate tel",
      })
      .populate({
        path: "user",
        select: "name", // Select only the 'name' field from the User model
      });
  }
  // Admin can see all bookings or filter by dentist if dentistId exists
  else {
    if (req.params.dentistId) {
      console.log("Fetching bookings for Dentist ID:", req.params.dentistId);
      query = Booking.find({ dentist: req.params.dentistId })
        .populate({
          path: "dentist",
          select: "name yearsOfExperience areaOfExpertise validate tel",
        })
        .populate({
          path: "user",
          select: "name", // Select only the 'name' field from the User model
        });
    } else {
      query = Booking.find()
        .populate({
          path: "dentist",
          select: "name yearsOfExperience areaOfExpertise validate tel",
        })
        .populate({
          path: "user",
          select: "name", // Select only the 'name' field from the User model
        });
    }
  }

  try {
    const bookings = await query;
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } 
  catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ success: false, message: "Cannot find Booking" });
  }
};

//@desc     Get Unavailable Booking
//@route    GET /api/v1/dentists/:dentID/unavilable
//@access   Private
exports.getUnavailableBooking = async (req,res, _next) => {
  try {
    const Unavailable = await Booking.find({isUnavailable: true});
    res.status(200).json({ success: true, count: Unavailable.length, data: Unavailable });
  } 
  catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ success: false, message: "Cannot find Booking" });
  }
}

//@desc     Get Unavailable Booking
//@route    GET /api/v1/dentists/:dentID/unavilable
//@access   Private
exports.getUnavailableBookingByDentID = async (req,res, _next) => {
  try {
    const Unavailable = await Booking.find({dentist: req.params.dentistId ,isUnavailable: true});
    res.status(200).json({ success: true, count: Unavailable.length, data: Unavailable });
  } 
  catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ success: false, message: "Cannot find Booking" });
  }
}

//@desc     Get one booking
//@route    GET /api/v1/bookings/:id
//@access   Private
exports.getBooking = async (req, res, _next) => {
  try {
    console.log("Request Params ID:", req.params.id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(req.params.id);

    // Query database
    const booking = await Booking.findOne({ id: objectId }).populate({
      path: "dentist",
      select: "name yearsOfExperience areaOfExpertise validate tel",
    });

    console.log("Fetched Booking:", booking);

    if (!booking) {
      return res.status(404).json({ success: false, message: `No booking found with ID ${req.params.id}` });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({ success: false, message: "Cannot find Booking" });
  }
};

//@desc     Add booking
//@route    POST /api/v1/bookings
//@access   Private
exports.addBooking = async (req, res, _next) => {
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
    const existedBookings = await Booking.find({ user: userId });

    // Restrict non-admin users to one booking
    if (existedBookings.length >= 1 && req.user.role !== "admin" && req.user.role !== "dentist") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${userId} is limited to one booking.`,
      });
    }

    const apptDateAndTime = new Date(req.body.apptDateAndTime);
    console.log("Normalized apptDate:", apptDateAndTime);

    // Check for existing bookings at the same time
    const existingBooking = await Booking.findOne({
      dentist: dentistId,
      apptDateAndTime,
    });

    console.log("Query Parameters:", {
      dentist: dentistId,
      apptDateAndTime,
    });

    const checkAvailable = req.body.isUnavailable
    if (checkAvailable) {

      if (existingBooking && existingBooking.isUnavailable) {
        return res.status(500).json({ success: false, message: "you've marked this time" });
      }      
      if(req.user.role == 'user') res.status(500).json({ success: false, message: "Cannot create booking" });

      const apptDateAndTime = new Date(req.body.apptDateAndTime);

      // Remove all bookings with same dentist in the range and not marked as unavailable
      const result = await Booking.deleteOne({
        dentist: dentistId,
        apptDateAndTime,
        isUnavailable: false
      });
      console.log('Delete Booking: ', result.deletedCount);
    }
    else if (existingBooking) {
      return res.status(400).json({
        success: false,
        message:
          "this time is not available",
      });
    }
    
    // Create the booking with the correct owner
    const booking = await Booking.create(req.body);

    // Return success response
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ success: false, message: "Cannot create booking" });
  }
};

//@desc     Update booking
//@route    PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async (req, res, _next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`,
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if(booking.isUnavailable){
      if(req.user.role == "user") {
        return res
        .status(500)
        .json({ success: false, message: "You don't have permission" });
      }
      const result = await Booking.deleteOne({
        dentist: booking.dentist,
        apptDateAndTime: booking.apptDateAndTime,
        isUnavailable: false
      });
      console.log("delete booking", result.count)
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot update Booking" });
  }
};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBooking = async (req, res, _next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`,
      });
    }

    await booking.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot delete Booking" });
  }
};

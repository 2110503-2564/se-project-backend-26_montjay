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
//@route    GET /api/v1/bookings/unavailable
//@access   Private
exports.getUnavailableBooking = async (req, res, _next) => {
  try {
    const unavailable = await Booking.find({ isUnavailable: true });
    res.status(200).json({ success: true, count: unavailable.length, data: unavailable });
  } 
  catch (error) {
    console.error("Error fetching unavailable bookings:", error);
    return res.status(500).json({ success: false, message: "Cannot find unavailable slots" });
  }
}

//@desc     Get Unavailable Booking by Dentist ID
//@route    GET /api/v1/dentists/:dentistId/unavailable
//@access   Private
exports.getUnavailableBookingByDentID = async (req, res, _next) => {
  try {
    if (!req.params.dentistId) {
      return res.status(400).json({ success: false, message: "Dentist ID is required" });
    }

    const unavailable = await Booking.find({
      dentist: req.params.dentistId,
      isUnavailable: true
    });
    
    res.status(200).json({ success: true, count: unavailable.length, data: unavailable });
  } 
  catch (error) {
    console.error("Error fetching unavailable bookings by dentist:", error);
    return res.status(500).json({ success: false, message: "Cannot find unavailable slots" });
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

    const booking = await Booking.findById(req.params.id).populate({
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
    // Get user ID from request body or from authenticated user
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
    
    const apptDateAndTime = new Date(req.body.apptDateAndTime);
    console.log("Normalized appointment date:", apptDateAndTime);

    // Check for existing bookings at the same time
    const existingBooking = await Booking.findOne({
      dentist: dentistId,
      apptDateAndTime,
    });

    console.log("Query Parameters:", {
      dentist: dentistId,
      apptDateAndTime,
    });

    // Handle unavailable time slot creation (dentist or admin only)
    if (req.body.isUnavailable) {
      // Check if user is authorized to mark time slots as unavailable
      if (req.user.role !== 'admin' && req.user.role !== 'dentist') {
        return res.status(403).json({ 
          success: false, 
          message: "Only dentists and admins can mark time slots as unavailable" 
        });
      }
      
      // If there's already an unavailable slot for this time, prevent duplicate
      if (existingBooking && existingBooking.isUnavailable) {
        return res.status(400).json({ 
          success: false, 
          message: "This time slot is already marked as unavailable" 
        });
      }
      
      // If there's an existing booking for this time, cancel it first
      if (existingBooking) {
        // Update existing booking to cancelled status
        await Booking.findByIdAndUpdate(existingBooking._id, { status: "Cancel" });
        console.log('Existing booking cancelled to make way for unavailable slot');
      }
    } 
    // Regular booking creation
    else {
      // Check for existing bookings by the user (limit non-admin users to one booking)
      if (req.user.role !== "admin" && req.user.role !== "dentist") {
        const existedBookings = await Booking.find({ user: userId, status: "Booked" });
        if (existedBookings.length >= 1) {
          return res.status(400).json({
            success: false,
            message: `The user with ID ${userId} is limited to one active booking.`,
          });
        }
      }
      
      // If the slot is already booked or unavailable, prevent booking
      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: "This time slot is not available",
        });
      }
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

    // Check authorization - user must be booking owner, admin, or dentist for respective bookings
    const isOwner = booking.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    const isDentist = req.user.role === "dentist" && booking.dentist.toString() === req.body.dentist;
    
    if (!isOwner && !isAdmin && !isDentist) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`,
      });
    }

    // Handle special case for toggling unavailability status
    if (req.body.hasOwnProperty('isUnavailable')) {
      // Only dentists and admins can change availability
      if (req.user.role !== 'admin' && req.user.role !== 'dentist') {
        return res.status(403).json({
          success: false,
          message: "Only dentists and admins can change availability status",
        });
      }
      
      // If we're changing a regular booking to unavailable, cancel any existing booking
      if (req.body.isUnavailable && !booking.isUnavailable) {
        // Find any other bookings at the same time for this dentist
        const conflictingBookings = await Booking.find({
          dentist: booking.dentist,
          apptDateAndTime: booking.apptDateAndTime,
          _id: { $ne: booking._id }, // Exclude the current booking
          isUnavailable: false
        });
        
        // Cancel those bookings
        if (conflictingBookings.length > 0) {
          await Promise.all(conflictingBookings.map(async (b) => {
            await Booking.findByIdAndUpdate(b._id, { status: "Cancel" });
          }));
          console.log(`Cancelled ${conflictingBookings.length} conflicting bookings`);
        }
      }
    }

    // Update the booking
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

      booking.status = "Cancel";

      const result = await Booking.findOneAndUpdate({
        dentist: booking.dentist,
        apptDateAndTime: booking.apptDateAndTime,
        isUnavailable: false
      },
      {
        status: "Cancel"
      });
      if (result) {
        console.log('Cancel booking');
      } else {
        console.log('No booking found to cancel.');
      }
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

    // Check authorization - allow booking owner, admin, or dentist if it's their booking
    const isOwner = booking.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    const isDentist = req.user.role === "dentist" && booking.dentist.toString() === req.body.dentist;
    
    if (!isOwner && !isAdmin && !isDentist) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`,
      });
    }
    
    // Allow dentists to remove their unavailable slots
    if (booking.isUnavaliable && req.user.role === "dentist") {
      // Additional verification could be added here if needed
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
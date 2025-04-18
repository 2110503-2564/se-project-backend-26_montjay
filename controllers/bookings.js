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
        select: "name tel email",
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
          select: "name tel email",
        });
    } else {
      query = Booking.find()
        .populate({
          path: "dentist",
          select: "name yearsOfExperience areaOfExpertise validate tel",
        })
        .populate({
          path: "user",
          select: "name tel email",
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

//@desc     Get all dentists' schedules ( upcoming bookings )
//@route    GET /api/v1/bookings/schedules
//@access   Private
exports.getAllDentistSchedules = async (req, res, _next) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can view all dentists' schedules",
      });
    }

    const currentDate = new Date();

    const dentists = await Dentist.find().populate({
      path: "user",
      select: "name tel email",
    });

    console.log("Fetched Dentists:", dentists);

    const schedules = [];

    for (const dentist of dentists) {
      const upcomingBookings = await Booking.find({
        dentist: dentist._id,
        apptDateAndTime: { $gte: currentDate },
        status: "Booked",
        isUnavailable: false,
      }).populate({
        path: "user",
        select: "name tel email",
      }).sort({ apptDateAndTime: 1 });

      schedules.push({
        dentist: {
          id: dentist._id,
          name: dentist.user,
          email: dentist.user,
          tel: dentist.user,
          yearsOfExperience: dentist.yearsOfExperience,
          areaOfExpertise: dentist.areaOfExpertise,
        },
        upcomingBookings: upcomingBookings.map(booking => ({
          id: booking._id,
          date: booking.apptDateAndTime,
          patientName: booking.user,
          patientContact: booking.user,
          patientEmail: booking.user,
          status: booking.status,
        })),
      });
    }

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching dentist schedules:", error);
    return res.status(500).json({
      success: false,
      message: "Cannot fetch dentist schedules",
      error: error.message,
    });
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

//@desc     Get Single booking
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

    const dentist = await Dentist.findById(dentistId);
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: `No dentist found with the ID ${dentistId}`,
      });
    }

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

    if (req.body.isUnavailable) {
      if (req.user.role !== 'admin' && req.user.role !== 'dentist') {
        return res.status(403).json({
          success: false,
          message: "Only dentists and admins can mark time slots as unavailable"
        });
      }

      if (existingBooking && existingBooking.isUnavailable) {
        return res.status(400).json({
          success: false,
          message: "This time slot is already marked as unavailable"
        });
      }

      if (existingBooking) {
        await Booking.findByIdAndUpdate(existingBooking._id, { status: "Cancel" });
        console.log('Existing booking cancelled to make way for unavailable slot');
      }
    }
    else {
      if (req.user.role !== "admin" && req.user.role !== "dentist") {
        const existedBookings = await Booking.find({ user: userId, status: "Booked" });
        if (existedBookings.length >= 1) {
          return res.status(400).json({
            success: false,
            message: `The user with ID ${userId} is limited to one active booking.`,
          });
        }
      }

      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: "This time slot is not available",
        });
      }
    }

    const booking = await Booking.create(req.body);

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
      // Check if user is admin or dentist
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
          _id: { $ne: booking._id },
          isUnavailable: false
        });

        if (conflictingBookings.length > 0) {
          await Promise.all(conflictingBookings.map(async (b) => {
            await Booking.findByIdAndUpdate(b._id, { status: "Cancel" });
          }));
          console.log(`Cancelled ${conflictingBookings.length} conflicting bookings`);
        }
      }
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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

    const isOwner = booking.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    const isDentist = req.user.role === "dentist" && booking.dentist.toString() === req.body.dentist;

    if (!isOwner && !isAdmin && !isDentist) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`,
      });
    }

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
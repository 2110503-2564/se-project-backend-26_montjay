const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Dentist = require("../models/Dentist");
const offHours = require("../models/OffHour");

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
        select: "yearsOfExperience areaOfExpertise validate",
        populate: {
          path: "user",
          select: "name tel email",
        },
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
          select: "yearsOfExperience areaOfExpertise validate",
          populate: {
            path: "user",
            select: "name tel email",
          },
        })
        .populate({
          path: "user",
          select: "name tel email",
        });
    } else {
      query = Booking.find()
        .populate({
          path: "dentist",
          select: "yearsOfExperience areaOfExpertise validate",
          populate: {
            path: "user",
            select: "name tel email",
          },
        })
        .populate({
          path: "user",
          select: "name tel email",
        });
    }
  }

  try {
    const bookings = await query;
    res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Booking" });
  }
};

//@desc     Get bookings for dentist
//@route    GET /api/v1/bookings/dentist
//@access   Public
exports.getBookingsForDentist = async (req, res, next) => {
  let query;

  // Dentist can see a schedule
  if (req.user.role === "dentist") {
    try {
      const dentistId = await Dentist.findOne({ user: req.user._id });

      if (!dentistId) {
        return res.status(400).json({ message: "Invalid dentist ID" });
      }

      query = Booking.find({ dentist: dentistId._id })
        .populate({
          path: "dentist",
          select: "yearsOfExperience areaOfExpertise validate",
          populate: {
            path: "user",
            select: "name tel email",
          },
        })
        .populate({
          path: "user",
          select: "name tel email",
        });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return res
        .status(500)
        .json({ success: false, message: "Cannot find Booking" });
    }
  }
  // Admin can see all bookings
  else if (req.user.role === "admin") {
    query = Booking.find()
      .populate({
        path: "dentist",
        select: "yearsOfExperience areaOfExpertise validate",
        populate: {
          path: "user",
          select: "name tel email",
        },
      })
      .populate({
        path: "user",
        select: "name tel email",
      });
  }
  // General users can only see their own bookings
  else {
    query = Booking.find({ user: req.user._id })
      .populate({
        path: "dentist",
        select: "yearsOfExperience areaOfExpertise validate",
        populate: {
          path: "user",
          select: "name tel email",
        },
      })
      .populate({
        path: "user",
        select: "name tel email",
      });
  }

  try {
    const bookings = await query;
    console.log("bookings:", bookings);
    res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Booking" });
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
    // Filter by date range if provided
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : currentDate;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days ahead

    const dentists = await Dentist.find().populate({
      path: "user",
      select: "name tel email",
    });

    const schedules = [];

    for (const dentist of dentists) {
      // Get all booked appointments
      const upcomingBookings = await Booking.find({
        dentist: dentist._id,
        apptDate: { $gte: startDate, $lte: endDate },
        status: "Booked",
        isUnavailable: false,
      })
        .populate({
          path: "user",
          select: "name tel email",
        })
        .sort({ apptDate: 1 });

      // Get all unavailable time slots ( holidays, off-hours )
      const unavailableSlots = await Booking.find({
        dentist: dentist._id,
        apptDate: { $gte: startDate, $lte: endDate },
        isUnavaliable: true,
      }).sort({ apptDate: 1 });

      schedules.push({
        dentist: {
          id: dentist._id,
          user: dentist.user,
          yearsOfExperience: dentist.yearsOfExperience,
          areaOfExpertise: dentist.areaOfExpertise,
        },
        upcomingBookings: upcomingBookings.map((booking) => ({
          id: booking._id,
          date: booking.apptDateAndTime,
          patientName: booking.user ? booking.user.name : "Unknown",
          patientContact: booking.user ? booking.user.tel : "",
          patientEmail: booking.user ? booking.user.email : "",
          status: booking.status,
        })),
        unavailableSlots: unavailableSlots.map((slot) => ({
          id: slot._id,
          date: slot.apptDateAndTime,
          createdAt: slot.createdAt,
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

//@desc     Get Single booking
//@route    GET /api/v1/bookings/:id
//@access   Private
exports.getBooking = async (req, res, _next) => {
  try {
    console.log("Request Params ID:", req.params.id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid booking ID format" });
    }

    const booking = await Booking.findById(req.params.id).populate({
      path: "dentist",
      select: "yearsOfExperience areaOfExpertise validate",
      populate: {
        path: "user",
        select: "name tel email",
      },
    });

    console.log("Fetched Booking:", booking);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Booking" });
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

    const existingOffHours = await offHours.find({
      $or: [
        {
          owner: dentist.user,
          startDate: { $lte: apptDateAndTime },
          endDate: { $gte: apptDateAndTime },
        },
        {
          isForAllDentist: true,
          startDate: { $lte: apptDateAndTime },
          endDate: { $gte: apptDateAndTime },
        },
      ],
    });

    if (existingOffHours.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This time slot is not available",
      });
    }

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "Some people have booked this time.",
      });
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
    const isDentist =
      req.user.role === "dentist" &&
      booking.dentist.toString() === req.body.dentist;

    if (!isOwner && !isAdmin && !isDentist) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`,
      });
    }

    // Handle special case for toggling unavailability status
    if (Object.prototype.hasOwnProperty.call(req.body, "isUnavailable")) {
      // Check if user is admin or dentist
      if (req.user.role !== "admin" && req.user.role !== "dentist") {
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
          isUnavailable: false,
        });

        if (conflictingBookings.length > 0) {
          await Promise.all(
            conflictingBookings.map(async (b) => {
              await Booking.findByIdAndUpdate(b._id, { status: "Cancel" });
            }),
          );
          console.log(
            `Cancelled ${conflictingBookings.length} conflicting bookings`,
          );
        }
      }
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (booking.isUnavailable) {
      if (req.user.role === "user") {
        return res
          .status(500)
          .json({ success: false, message: "You don't have permission" });
      }

      booking.status = "Cancel";

      const result = await Booking.findOneAndUpdate(
        {
          dentist: booking.dentist,
          apptDateAndTime: booking.apptDateAndTime,
          isUnavailable: false,
        },
        {
          status: "Cancel",
        },
      );
      if (result) {
        console.log("Cancel booking");
      } else {
        console.log("No booking found to cancel.");
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

    const isOwner = booking.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    const isDentist =
      req.user.role === "dentist" &&
      booking.dentist.toString() === req.body.dentist;

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

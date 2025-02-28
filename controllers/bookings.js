const Booking = require("../models/Booking");
const Dentist = require("../models/Dentist");

//@desc     Get all appointments
//@route    GET /api/v1/appointments
//@access   Public
exports.getBookings = async (req, res, _next) => {
  let query;

  //General users can see only their appointments
  if (req.user.role !== "admin") {
    query = Booking.find({ user: req.user.id }).populate({
      path: "dentist",
      select: "name yearsOfExperience areaOfExpertise validate tel",
    });
  }
  //Admin can see all appointments
  else {
    if (req.params.dentistId) {
      console.log(req.params.dentistId);
      query = Booking.find({ dentist: req.params.dentistId }).populate({
        path: "dentist",
        select: "name yearsOfExperience areaOfExpertise validate tel",
      });
    } else {
      query = Booking.find().populate({
        path: "dentist",
        select: "name yearsOfExperience areaOfExpertise validate tel",
      });
    }
  }

  try {
    const bookings = await query;
    res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Booking" });
  }
};

exports.getBooking = async (req, res, _next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "dentist",
      select: "name yearsOfExperience areaOfExpertise validate tel",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Appointment" });
  }
};

//@desc     Add appointment
//@route    POST /api/v1/bookings
//@access   Private
exports.addBooking = async (req, res, _next) => {
  try {
    // Get dentist ID from request body
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

    // Add user ID to request body
    req.body.user = req.user.id;

    // Check for existing bookings by the user
    const existedBookings = await Booking.find({ user: req.user.id });

    // Restrict non-admin users to one booking
    if (existedBookings.length >= 1 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} is limited to one booking.`,
      });
    }

    // Normalize apptDate to start of day (if time component is not relevant)
    const apptDate = new Date(req.body.apptDate);

    console.log("Normalized apptDate:", apptDate);

    // Check bookings 
    const existingBooking = await Booking.findOne({
      dentist: dentistId,
      apptDate: apptDate, // Use the normalized date
      appointmentTime: req.body.appointmentTime
    });

    // Debugging: Log the query parameters
    console.log("Query Parameters:", {
      dentist: dentistId,
      apptDate: apptDate,
      appointmentTime: req.body.appointmentTime
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "A booking already exists for this dentist at the same date and time.",
      });
    }

    // Create the booking
    const booking = await Booking.create(req.body);

    // Return success response
    res.status(200).json({ success: true, data: booking });
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

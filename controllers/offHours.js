const mongoose = require("mongoose");
const OffHour = require("../models/OffHour");
const Booking = require("../models/Booking");
const Dentist = require("../models/Dentist");
const User = require("../models/User")

//@desc     Get all OffHours
//@route    GET /api/v1/offHours
//@access   Public
exports.getOffHours = async (req, res) => {
  try {
    const query = OffHour.find()
    .populate({
      path: "owner",
      select: "name tel email",
    })

    const OffHours = await query;
    res.status(200).json({ success: true, count: OffHours.length, data: OffHours });
  }
  catch (error) {
    console.error("Error fetching OffHours:", error);
    return res.status(500).json({ success: false, message: "Cannot find OffHours" });
  }
};

//@desc     Get all OffHours by ownerId
//@route    GET /api/v1/offHours/owner/:ownerId
//@access   Public
exports.getOffHoursByOwnerId = async (req, res, next) => {
  try {
    const ownerId = req.params.ownerId.trim();
    console.log("Request Params ID:", req.params.ownerId);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.ownerId)) {
      return res.status(400).json({ success: false, message: "Invalid Owner ID format" });
    }

    // Query database
    const offHours = await OffHour.find({ owner: ownerId }).populate({
        path: "owner",
        select: "name tel email",
    });

    console.log("Fetched OffHours:", offHours);

    if (!offHours) {
      return res.status(404).json({ success: false, message: `No comment found with ID ${req.params.ownerId}` });
    }

    res.status(200).json({ success: true, count: offHours.length, data: offHours });
  } catch (error) {
    console.error("Error fetching offHours:", error);
    return res.status(500).json({ success: false, message: "Cannot find offHours" });
  }
}

//@desc     Get one OffHour
//@route    GET /api/v1/offHours/:id
//@access   Private
exports.getOffHour = async (req, res, _next) => {
  try {
    console.log("Request Params ID:", req.params.id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid OffHour ID format" });
    }

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(req.params.id);

    // Query database
    const offHour = await OffHour.findOne({ id: objectId }).populate({
        path: "owner",
        select: "name tel email",
    });

    console.log("Fetched OffHour:", offHour);

    if (!offHour) {
      return res.status(404).json({ success: false, message: `No offHour found with ID ${req.params.id}` });
    }

    res.status(200).json({ success: true, data: offHour });
  } catch (error) {
    console.error("Error fetching offHour:", error);
    return res.status(500).json({ success: false, message: "Cannot find offHour" });
  }
};

//@desc     Add OffHour
//@route    POST /api/v1/offHours
//@access   Private
exports.addOffHour = async (req, res, next) => {
  try {
    // Get owner ID from request body 
    const ownerId = req.body.owner || req.user.id;
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    // Validate owner ID
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a owner ID in the request body",
      });
    }

    // Validate timeslot
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide a owner ID in the request body",
      });
    }

    const current = new Date();

    if (current > startDate || startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "Date is Invalid",
      });
    }

    // Check if user exists
    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with the ID ${ownerId}`,
      });
    }

    // Ensure owner ID is correctly assigned
    req.body.user = ownerId;

    // Create the booking with the correct owner
    const offHour = await OffHour.create(req.body);

    const isDentist = await Dentist.findOne({ user: ownerId });

    if( req.body.isForAllDentist === true) {
      const result = await Booking.updateMany(
        {
          apptDateAndTime: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          isUnavailable: false,
          status: "Booked",
        },
        {
          $set: { status: "cancel", isUnavailable: true },
        }
      );
      console.log(`Canceled booking: ${result.matchedCount}`);
    }
    else if(isDentist){
      const result = await Booking.updateMany(
        {
          dentist: isDentist,
          apptDateAndTime: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          isUnavailable: false,
          status: "Booked",
        },
        {
          $set: { status: "cancel", isUnavailable: true },
        }
      );
      console.log(`Canceled booking: ${result.matchedCount}`);
    }

    // Return success response
    res.status(201).json({ success: true, data: offHour });
  } catch (error) {
    console.error("Error creating offHour:", error);
    res.status(500).json({ success: false, message: "Cannot create offHour" });
  }
};

//@desc     Update offHour
//@route    PUT /api/v1/offHours/:id
//@access   Private
exports.updateOffHour = async (req, res, _next) => {
  try {
    let offHour = await OffHour.findById(req.params.id);

    if (!offHour) {
      return res.status(404).json({
        success: false,
        message: `No offHour with the id of ${req.params.id}`,
      });
    }

    if (offHour.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this offHour`,
      });
    }

    offHour = await OffHour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: offHour });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot update offHour" });
  }
};

//@desc     Delete offHour
//@route    DELETE /api/v1/offHours/:id
//@access   Private
exports.deleteOffHour = async (req, res, _next) => {
  try {
    const offHour = await OffHour.findById(req.params.id);

    if (!offHour) {
      return res.status(404).json({
        success: false,
        message: `No offHour with the id of ${req.params.id}`,
      });
    }

    if (offHour.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this offHour`,
      });
    }

    await offHour.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot delete offHour" });
  }
};

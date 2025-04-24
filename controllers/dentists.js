const Dentist = require("../models/Dentist.js");
const Booking = require("../models/Booking.js");
const OffHour = require("../models/OffHour.js")

//@desc     Get all dentists
//@route    GET /api/v1/dentists
//@access   Public
exports.getDentists = async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };

  const removeFields = ["select", "sort", "page", "limit"];

  removeFields.forEach((param) => delete reqQuery[param]);
  console.log(reqQuery);

  let queryStr = JSON.stringify(reqQuery);

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`,
  );

  query = Dentist.find(JSON.parse(queryStr)).populate("bookings")
    .populate({
      path: "user",
      select: "name",
    });

  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const total = await Dentist.countDocuments();
    query = query.skip(startIndex).limit(limit);

    const dentists = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.previous = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: dentists.length,
      data: dentists,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.getDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.findById(req.params.id);

    if (!dentist) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({ success: true, data: dentist });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.createDentist = async (req, res, next) => {
  const dentist = await Dentist.create(req.body);
  res.status(201).json({ success: true, data: dentist });
};

exports.updateDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!dentist) {
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true, data: dentist });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

//@desc     Delete dentist
//@route    DELETE /api/v1/dentists/:id
//@access   Private
exports.deleteDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.findById(req.params.id);

    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: `Dentist not found with id of ${req.params.id}`,
      });
    }

    await Booking.deleteMany({ dentist: req.params.id });
    await Dentist.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.getDentistDetail = async (req, res, next) => {
  try{
    const detail = await Dentist.findById(req.params.dentID)
    .populate({
      path: "user",
      select: "name"
    })
    .populate({
      path: "bookings",
      select: "apptDateAndTime user status"
    })
    .populate({
      path: "comments",
      select: "user comment"
    })
    .populate({
      path: "OffHours",
      select: "startDate endDate description"
    });
    const offHour = await OffHour.find({isForAllDentist: true});
    if(!detail) res.status(404).json({ success: false, message: "there is no dentist"});
    res.status(200).json({ success: true, data: detail, offHour });
    
  } catch(error){
    console.log("error: " , error)
    res.status(500).json({ success: false });
  }
}
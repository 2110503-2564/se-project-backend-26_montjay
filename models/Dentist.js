const mongoose = require("mongoose");

const DentistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true
    },
    yearsOfExperience: {
      type: Number,
      required: [true, "Please add years of experience"],
      min: [0, "Years of experience cannot be negative"],
    },
    areaOfExpertise: {
      type: [String],
      required: [true, "Please add at least one area of expertise"],
      enum: [
        "Orthodontics",
        "Pediatric Dentistry",
        "Endodontics",
        "Prosthodontics",
        "Periodontics",
        "Oral Surgery",
        "General Dentistry",
      ],
      validate: {
        validator: (v) => v.length > 0,
        message: "Please add at least one area of expertise",
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

DentistSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "dentist",
  justOne: false,
});

DentistSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "dentist",
  justOne: false,
});

module.exports = mongoose.model("Dentist", DentistSchema);
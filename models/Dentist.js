const mongoose = require("mongoose");

const DentistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
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

module.exports = mongoose.model("Dentist", DentistSchema);

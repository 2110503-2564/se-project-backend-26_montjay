const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    apptDateAndTime: {
        type: Date,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    dentist: {
        type: mongoose.Schema.ObjectId,
        ref: "Dentist",
        required: true
    },
    isUnavailable: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: [
            "Booked",
            "Cancel"
        ],
        default: "Booked"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Booking", BookingSchema);

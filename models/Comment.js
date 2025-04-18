const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
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
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Comment", CommentSchema);

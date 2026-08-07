const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "username already taken"],
        required: true,
        trim: true,
        minlength: [3, "Username must be at least 3 characters"]
    },
    email: {
        type: String,
        unique: [true, "Account already exists with this email address"],
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true  // adds createdAt and updatedAt
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel

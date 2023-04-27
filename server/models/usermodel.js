// File: ./models/usermodel.js

// Require Mongoose
const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: String,
    salt: Number,
    hash: String,

    profile: {
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'Profile',
    }
});

// Export function to create "User" model class
module.exports = mongoose.model("User", UserSchema);
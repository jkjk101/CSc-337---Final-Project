// File: ./models/profilemodel.js

// Require Mongoose
const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
    name: String,
    email: String,
    phone: String,
    bio: String,
    picture: {
        data: Buffer,
        contentType: String
    },
    
    projects: [{
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'Project',
        default: null
    }]
});

// Export function to create "Profile" model class
module.exports = mongoose.model("Profile", ProfileSchema);
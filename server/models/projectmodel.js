// File: ./models/projectmodel.js

// Require Mongoose
const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    title: String,
    description: String,
    source_file: {
        filename: String,
        data: Buffer,
        contentType: String
    }
});

// Export function to create "Project" model class
module.exports = mongoose.model("Project", ProjectSchema);
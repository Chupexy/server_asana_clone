const mongoose = require('mongoose');
const Schema = mongoose.Schema

const projectSchema = new Schema({
project_name: String,
user_id: String,
tasks: [String],
due_date: String,
project_description: String,
is_completed: {type: Boolean, default: false},
sections: [String],
privacy_status: {type: String, default: 'Me'}, //Me or invited members
timestamp: Number
}, {collection: 'projects'})

const model = mongoose.model('Project', projectSchema)
module.exports= model
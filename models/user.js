const mongoose = require('mongoose');
const Schema = mongoose.Schema

const userSchema = new Schema({
    fullname: String,
    email: String,
    password: String,
    mytasks: [String],
    no_of_tasks_completed: {type: String, default: 0},
    collaborators: [String], // persons you invite
    invited_by: [String],// invited by{id of the person who invited} and date
    projects: [String],
    job_title: String,
    department: String,
    about_me: String,
    invite_type: {type: String, default: 'signup'}, // signup 
    timestamp: Number,
    img_id: String,
    img_url: String,
    is_deleted: {type: Boolean, default: false},
    is_online: {type: Boolean, default: false},
    last_login: Number,
    last_logout: Number

}, {collection: 'users'})

const model = mongoose.model('User', userSchema)
module.exports = model
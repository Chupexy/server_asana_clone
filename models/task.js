const mongoose = require('mongoose')
const Schema = mongoose.Schema

const taskSchema = new Schema({
user_id: String,
task_name: String,
due_date: String, // ill confirm if its a string or number later
assigned_to: [String],
project: String,
section: String,
description: String,
privacy_status: {type: String, default: "private"}, // public, if you want other persons to access it
completion_status: {type: String, default: "Not started"}, // not started, in progress, completed, on hold, cancelled, testing
is_overdue: {type: Boolean, default: false},
timestamp: Number,
priority: {type: String, default: ''}, // high, medium, low, only for tasks under a project
in_project: {type: Boolean, default: false},
comments: [String],
comment_count: {type: Number, default: 0}
},{collection : 'tasks'})

const model = mongoose.model('Task', taskSchema)
module.exports = model
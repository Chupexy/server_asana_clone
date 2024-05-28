const mongoose = require('mongoose')
const Schema = mongoose.Schema

const taskSchema = new Schema({
user_id: String,
task_name: String,
due_date: String, // ill confirm if its a string or number later
asignee: String,
assigned_to: [String],
project: String,
description: String,
subtask: [String],
privacy: {type: String, default: 'private'}, // public, if you want other persons to access it
is_completed: {type: Boolean, default: false},
is_overdue: {type: Boolean, default: false},
is_upcoming: {type: Boolean, default: true},
timestamp: Number,
likes: [String],
likes_count: {type: Number, default: 0},
priority: {type: String, default: ''}, // high, medium, low, only for tasks under a project
in_project: {type: Boolean, default: false}
},{collection : 'tasks'})

const model = mongoose.model('Task', taskSchema)
module.exports = model
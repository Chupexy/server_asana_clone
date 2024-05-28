const mongoose = require('mongoose')
const Schema = mongoose.Schema

const sectionSchema = new Schema({
user_id: String,
section_name: {type: String, default: 'untitled section'},
tasks:[String],
project_id: String
}, {collection: 'sections'})

const model = mongoose.model('Section', sectionSchema)
module.exports = model
const mongoose  = require('mongoose')
const Schema = mongoose.Schema

const teamSchema = new Schema({
    user_id: String,
    teammates: [String],
    timestamp: Number,
    invited_by: String

},{collection: 'teammates'})

const model = mongoose.model('Teammate', teamSchema)
module.exports = model
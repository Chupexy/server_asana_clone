const mongoose = require('mongoose')
const Schema = mongoose.Schema

const commentSchema = new Schema({
    owner_id : String,
    comment : String,
    timestamp: Number,
    task: String,
    replyto_comment_id: String,
    owner_name: String,
    owner_img: String
},{collection: 'comments'})

const model = mongoose.model('Comment', commentSchema)
module.exports = model
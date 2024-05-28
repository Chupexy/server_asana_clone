const mongoose = require('mongoose');
const { schema } = require('./user');
const Schema = mongoose.Schema

const likeSchema = new Schema({
    user_id : String,
    liker_id: [String],
    likee_id: [String],
    timestamp : Number

}, {collection : 'likes'})

const model = mongoose.model('Like', likeSchema)
module.exports = model
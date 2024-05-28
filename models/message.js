const mongoose = require('mongoose');
const Schema = mongoose.Schema

const messageSchema = new Schema({
    sender_id: String,
    sender_name: String,
    sender_img: String,
    receiver_id: String,
    conversation_id: String,
    message: String,
    msg_type: String, // text or file
    file_name: String,
    img_ids: [String],
    img_urls: [String],
    timestamp: Number
}, {collection: 'messages'});

const model = mongoose.model('Message', messageSchema);
module.exports = model;
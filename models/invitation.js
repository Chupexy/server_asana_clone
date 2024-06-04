const mongoose  = require('mongoose')
const Schema = mongoose.Schema

const invitationSchema = new Schema({
   sender_id: String,
   sender_img_id: String,
   sender_name: String,
   receiver_id: String,
   receiver_img_id: String,
   receiver_name: String,
   timestamp: Number,
   response: {type: String, default: 'processing'}, //processing, accepted, declined
},{collection: 'invitations'})

const model = mongoose.model('Invitation', invitationSchema)
module.exports = model
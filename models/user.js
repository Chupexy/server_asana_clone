const mongoose = require('mongoose');
const Schema = mongoose.Schema

const userSchema = new Schema({

}, {collection: 'users'})

const model = mongoose.model('user', userSchema)
module.exports = model
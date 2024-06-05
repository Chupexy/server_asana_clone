const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()


const Notification = require('../models/notification')

//view user notifications
router.post('/view_notifications', async(req, res) =>{
    const {token} = req.body
    if(!token) 
        return res.status(400).send({status: 'error', msg: 'All fields must be filled'})

    try {
        //verify user
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //get notification document
        const notifications = await Notification.find({receiver_id: user._id}).lean()

        if(notifications.length == 0)
            return res.status(400).send({status: 'ok', msg: 'No notifications at the momnent'})

        return res.status(200).send({status: 'ok', msg:'Successful', notifications , count: notifications.length})

    } catch (e) {
        console.log(error)
        if(error.name == 'JsonWebTokenError')
        return res.status(401).send({status: 'error', msg: 'Token Verification Failed', error: e})
    
    return res.status(500).send({status: 'error', msg: 'An error occured'})
    }
    
})


//view single notification
router.post('/view_notification', async(req, res) =>{
    const {token, notification_id} = req.body
    if(!token || !notification_id)
        return res.status(400).send({status: 'error', msg: 'All fields must be filled'})

    try {
        //verify token 
        jwt.verify(token , process.env.JWT_SECRET)

        //get notification document
        const notification = await Notification.findById({_id: notification_id}).lean()

        return res.status(200).send({status: 'ok', msg:'Successful', notification})
        
    } catch (e) {
        console.log(error)
        if(error.name == 'JsonWebTokenError')
        return res.status(401).send({status: 'error', msg: 'Token Verification Failed', error: e})
    
    return res.status(500).send({status: 'error', msg: 'An error occured'})
    }
})

module.exports = router
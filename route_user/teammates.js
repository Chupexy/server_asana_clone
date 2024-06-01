const express = require("express");

const jwt = require("jsonwebtoken");
const User = require('../models/user')
const dotenv = require('dotenv')
dotenv.config()
const router = express.Router()
const Notification = require('../models/notification')

//endpoint to invite teammate/collaborator
router.post('/invite_collaborator', async(req, res) =>{
    const {token, invitee_id} = req.body
    if(!token || !invitee_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const Muser = await User.findOne({_id: user._id}, {collaborators:1})

        //check if invitee exists
        const collaborator =  await User.findOne({_id: invitee_id}).lean()
        if(!collaborator)
            return res.status(200).send({status: 'ok', msg:'No User found'})

        //update user document
        Muser = await User.findByIdAndUpdate({_id: user._id}, {
            $push: {collaborators: invitee_id}
        }, {new: true}).lean()

        //update other user document
        const invitee = await User.findByIdAndUpdate({_id: invitee_id},
             {$push: {invited_by: user._id}
             //,is_invited: true
            }, {new: true}).lean()

            return res.status(200).send({status: 'ok', msg: 'Invitation sent'})

        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})


module.exports = router
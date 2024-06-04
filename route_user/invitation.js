const express = require("express");
const jwt = require("jsonwebtoken");
const User = require('../models/user')
const dotenv = require('dotenv')
dotenv.config()
const router = express.Router()
const Notification = require('../models/notification')
const Invitation = require('../models/invitation')

//endpoint to invite teammate/collaborator
router.post('/invite', async(req, res) =>{
    const {token, sender_id, receiver_id} = req.body
    if(!token || !sender_id || !receiver_id )
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        //check if receiver exists
        const collaborator =  await User.findOne({_id: receiver_id}).lean()
        if(!collaborator)
            return res.status(200).send({status: 'ok', msg:'No User found'})

        //get sender and receiver document
        const sender = await User.findOne({_id: sender_id}, {fullname: 1, img_id: 1}).lean()
        const receiver = await User.findOne({_id: receiver_id}, {fullname: 1, img_id: 1}).lean()

        //send invitation
        const invitation = new Invitation()
        invitation.receiver_id = receiver_id
        invitation.sender_id = sender_id
        invitation.sender_name = sender.fullname
        invitation.receiver_name = receiver.fullname
        invitation.sender_img_id = sender.img_id
        invitation.receiver_img_id = receiver.img_id
        invitation.timestamp = timestamp

            await invitation.save()

            
        // send notification to sender
      let Snotification = new Notification();
      Snotification.event = `Invitation sent`;
      Snotification.event_id = invitation._id;
      Snotification.message = `You sent an invitation to ${receiver_id}`;
      Snotification.timestamp = timestamp;
      Snotification.receiver_id = user._id;
      Snotification.sender_id = user._id;

      await Snotification.save();

      
        // send notification to receiver
        let Rnotification = new Notification();
        Rnotification.event = `Invitation received`;
        Rnotification.event_id = invitation._id;
        Rnotification.message = `You received an invitation from ${sender_id}`;
        Rnotification.timestamp = timestamp;
        Rnotification.receiver_id = receiver_id;
        Rnotification.sender_id = sender_id;
  
        await Rnotification.save();
  

            return res.status(200).send({status: 'ok', msg: 'Invitation sent'})

        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//view invitations
router.post('/view_invitations', async(req, res) =>{
    const {token} = req.body
    if(!token)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
       const user = jwt.verify(token, process.env.JWT_SECRET)

        //get invitations document
        const invitations = await Invitation.find({receiver_id: user._id}).lean()

        if(invitations.length == 0)
            return res.status(200).send({status:'ok', msg:'No invitation at the moment'})

        return res.status(200).send({status:'ok', msg:'Successful', invitations, count: invitations.length})
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//view invitation
router.post('/view_invitation', async(req, res) =>{
    const {token, invitation_id} = req.body
    if(!token || !invitation_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        jwt.verify(token, process.env.JWT_SECRET)

        //get invitation document
        const invitation = await Invitation.find({_id: invitation_id}).lean()

        return res.status(200).send({status:'ok', msg:'Successful', invitation})
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//accept invitation
router.post('/accept_invite', async(req, res) =>{
    const {token, invitation_id, response} = req.body
    if(!token || !invitation_id || !response)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        //get invitation document
        let invitation = await Invitation.findOne({_id: invitation_id}).lean()

        if(response !== 'accept')
            return res.status(400).send({status: 'error', msg:'Not accepting correctly'})

        //update invitation document
        invitation = await Invitation.findByIdAndUpdate({_id: invitation_id}, {response: 'accepted'}, {new: true})

        //update sender document
        await User.findOneAndUpdate({_id: invitation.sender_id}, {$push: {collaborators: invitation.receiver_id}}, {new: true})

        //update receiver document
        await User.findOneAndUpdate({_id: user._id}, {$push: {invited_by: invitation.sender_id}}, {new: true})

         // send notification to sender
      let Snotification = new Notification();
      Snotification.event = `Invitation accepted`;
      Snotification.event_id = invitation_id;
      Snotification.message = `Invitation you sent to ${invitation.receiver_id} has been accepted`;
      Snotification.timestamp = timestamp;
      Snotification.receiver_id = invitation.sender_id;
      Snotification.sender_id = user._id;

      await Snotification.save();

        return res.status(200).send({status: 'ok', msg:'Successful'})
        
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})   
    }
})

//decline invitation
router.post('/decline_invite', async(req, res) =>{
    const {token, invitation_id, response} = req.body
    if(!token || !invitation_id || !response)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        //get invitation document
        let invitation = await Invitation.findOne({_id: invitation_id}).lean()

        if(response !== 'decline')
            return res.status(400).send({status: 'error', msg:'Not declining correctly'})

        //update invitation document
        invitation = await Invitation.findByIdAndUpdate({_id: invitation_id}, {response: 'declined'}, {new: true})

         // send notification to sender
      let Snotification = new Notification();
      Snotification.event = `Invitation declined`;
      Snotification.event_id = invitation_id;
      Snotification.message = `Invitation you sent to ${invitation.receiver_id} has been declined`;
      Snotification.timestamp = timestamp;
      Snotification.receiver_id = invitation.sender_id;
      Snotification.sender_id = user._id;

      await Snotification.save();

        return res.status(200).send({status: 'ok', msg:'Successful'})
        
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})   
    }
})

module.exports = router
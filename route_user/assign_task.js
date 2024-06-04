const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()


const Task = require('../models/task')
const User = require('../models/user')
const Notification = require('../models/notification')

//view_collaborators
router.post('/view_collaborators', async(req, res) =>{
    const {token} = req.body
    if(!token)
        return res.status(400).send({status: 'error', msg: 'All fields must be filled'})
    
    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //get user document
        const collaborators = await User.findOne({_id: user._id}, {collaborators: 1}).lean()

        if(collaborators.collaborators.length == 0)
            return res.status(200).send({status: 'ok', msg: 'No collaborators'})

        return res.status(200).send({status: 'ok', msg: 'Successful', collaborators})
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})    
    }
})


//assign collaborator to task
router.post('/assign_task', async(req, res) =>{
    const {token, task_id, collaborator_id} = req.body
    if(!token || !task_id || !collaborator_id)
        return res.status(400).send({status: 'error', msg: 'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        let task = await Task.findOne({_id: task_id, user_id: user._id}, {assigned_to: 1}).lean()

        //update task document
        task = await Task.findOneAndUpdate({_id: task_id}, {assigned_to: collaborator_id})

        // send notification to sender
      let Snotification = new Notification();
      Snotification.event = `Task assignment successful`;
      Snotification.event_id = task_id;
      Snotification.message = `You assigned a task to ${collaborator_id}`;
      Snotification.timestamp = timestamp;
      Snotification.receiver_id = user._id;
      Snotification.sender_id = user._id;

      await Snotification.save();

      
        // send notification to receiver
        let Rnotification = new Notification();
        Rnotification.event = `Incoming Task asignment`;
        Rnotification.event_id = task_id;
        Rnotification.message = `You were assigned a task by ${user._id}`;
        Rnotification.timestamp = timestamp;
        Rnotification.receiver_id = collaborator_id;
        Rnotification.sender_id = user._id;
  
        await Rnotification.save();
  

        
        return res.status(200).send({status: 'ok', msg: 'Assign successful'})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'}) 
    }
})


//unassign task
router.post('/unassign_task', async(req, res) =>{
    const {token, task_id, collaborator_id} = req.body
    if(!token || !task_id || !collaborator_id)
        return res.status(400).send({status: 'error', msg: 'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        let task = await Task.findOne({_id: task_id, assigned_to: collaborator_id}, {assigned_to: 1}).lean()

        //update task document
        task = await Task.findOneAndUpdate({_id: task_id}, {assigned_to: ""})

        // send notification to sender
      let Snotification = new Notification();
      Snotification.event = `Unassign successful`;
      Snotification.event_id = task_id;
      Snotification.message = `You unassigned ${collaborator_id} from a task`;
      Snotification.timestamp = timestamp;
      Snotification.receiver_id = user._id;
      Snotification.sender_id = user._id;

      await Snotification.save();

      
        // send notification to receiver
        let Rnotification = new Notification();
        Rnotification.event = `Unassigned task`;
        Rnotification.event_id = task_id;
        Rnotification.message = `You were unassigned from a task by ${user._id}`;
        Rnotification.timestamp = timestamp;
        Rnotification.receiver_id = collaborator_id;
        Rnotification.sender_id = user._id;
  
        await Rnotification.save();
  

        return res.status(200).send({status: 'ok', msg: 'Unassign successful'})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'}) 
    }
})  



module.exports = router
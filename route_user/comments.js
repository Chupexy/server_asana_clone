const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router()
const dotenv = require('dotenv')
dotenv.config()

const Comment = require('../models/comments')
const Task = require('../models/task')
const Notification = require('../models/notification')


//endpoint to comment
router.post('/task_comment', async(req, res) =>{
    const {token, comment , task_id} = req.body
    if(!token || !comment || !task_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const task = await Task.findOne({_id: task_id}, {user_id: 1, comments: 1, comment_count: 1}).lean()
        const timestamp = Date.now()

        const Mcomment = new Comment()
        Mcomment.owner_id = user._id
        Mcomment.task = task_id
        Mcomment.timestamp = timestamp
        Mcomment.replyto_comment_id = ""
        Mcomment.comment = comment
        Mcomment.owner_name = ""
        Mcomment.owner_img = ""
        Mcomment.comment_replies = []

        await Mcomment.save()

        //update task document
        await Task.findOneAndUpdate({_id: task_id}, 
            {
                $push: {comments: Mcomment._id},
                 $inc: {comment_count: 1}
                }, {new: true}).lean()

        // send notification to user
      let notification = new Notification();
      notification.event = `New Comment`;
      notification.event_id = Mcomment._id;
      notification.message = `Commented on task ${Task.task_id}`;
      notification.timestamp = timestamp;
      notification.receiver_id = task.user_id;
      notification.sender_id = user._id;

      await notification.save();


        return res.status(200).send({status: 'ok', msg:'Comment posted'})
        
    } catch (e) {
        console.log(e)
        if(e.name == 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//edit comment
router.post('/edit_comment', async(req, res) =>{
    const {token, comment, comment_id} = req.body
    if(!token || !comment_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        jwt.verify(token, process.env.JWT_SECRET)

        let Mcomment = await Comment.findOne({_id: comment_id}, {comment: 1}).lean()

        Mcomment = await Comment.findByIdAndUpdate({_id: comment_id}, {
            comment: comment || Mcomment.comment
        }, {new: true}).lean()

        return res.status(200).send({status: 'ok', msg:'comment edited', Mcomment})
        
    } catch (e) {
        console.log(e)
        if(e.name == 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//view comment
router.post('/view_comment', async(req, res) =>{
    const {token, comment_id} = req.body
    if(!token || !comment_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        
        jwt.verify(token, process.env.JWT_SECRET)

        const comment = await Comment.findOne({_id: comment_id})
        if(!comment)
            return res.status(200).send({status:'ok', msg:'Comment not found'})
        return res.status(200).send({status:'ok', msg:'Comment found', comment})
    } catch (e) {
        console.log(e)
        if(e.name == 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//view comments
router.post('/view_comments', async(req, res) =>{
    const {token, task_id} = req.body
    if(!token , !task_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        //verify token
        jwt.verify(token, process.env.JWT_SECRET)

        //get comments in a task
        const comments = await Comment.find({task: task_id}).lean()
        if(comments.length == 0)
            return res.status(200).send({status: 'ok', msg:'No comment found'})

        return res.status(200).send({status:'ok', msg:'Comments found', comments, count: comments.length})
        
    } catch (e) {
        console.log(e)
        if(e.name == 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})


//Delete a comment 
router.post('/delete_comment', async(req, res) =>{

})
module.exports = router
const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router()
const dotenv = require('dotenv')
dotenv.config()

const Comment = require('../models/comments')
const Task = require('../models/task')
const Notification = require('../models/notification')


//endpoint to reply a comment
router.post('/comment_reply', async(req, res) =>{
    const {token, comment , comment_id} = req.body
    if(!token || !comment || !comment_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {

        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
    
        const Ncomment = await Comment.findOne({_id: comment_id}, {comment_replies: 1, task: 1, user_id: 1, comment_reply_count: 1}).lean()
        const timestamp = Date.now()

        const Mcomment = new Comment()
        Mcomment.owner_id = user._id
        Mcomment.task = Ncomment.task
        Mcomment.timestamp = timestamp
        Mcomment.replyto_comment_id = comment_id
        Mcomment.comment = comment
        Mcomment.owner_name = "",
        Mcomment.owner_img = ""
        Mcomment.comment_replies = []

        await Mcomment.save()

        //update main comment document
        await Comment.findByIdAndUpdate({_id: comment_id},
            {
                $push: {comment_replies: Mcomment._id},
                $inc: {comment_reply_count: 1}
                }, {new: true}).lean()

         //update task document
        await Task.findOneAndUpdate({_id: Ncomment.task}, 
            {
                $push: {comments: Mcomment._id},
                 $inc: {comment_count: 1}
                }, {new: true}).lean()

        // send notification to user
      let notification = new Notification();
      notification.event = `New Comment reply`;
      notification.event_id = Mcomment._id;
      notification.message = `Replied to comment ${comment_id}`;
      notification.timestamp = timestamp;
      notification.receiver_id = Ncomment.user_id;
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

//edit comment_reply
router.post('/edit_comment_reply', async(req, res) =>{
    const {token, comment, comment_id} = req.body
    if(!token || !comment_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        jwt.verify(token, process.env.JWT_SECRET)

        const Mcomment = await Comment.findOne({comment_id}, {comment: 1}).lean()

        Mcomment = await Comment.findByIdAndUpdate({comment_id}, {
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

//view comment replies
router.post('/view_comment_replies', async(req, res) =>{
    const {token, comment_id} = req.body
    if(!token , !comment_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        //verify token
        jwt.verify(token, process.env.JWT_SECRET)

        //get comments in a comment
        const comments = await Comment.find({replyto_comment_id: comment_id}).lean()
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

// where Mcomment_id is the main comment id
//Delete a comment 
router.post('/delete_comment_reply', async(req, res) =>{
    const {token, comment_id ,Mcomment_id, task_id} = req.body
    if(!token || !comment_id || !task_id || !Mcomment_id)
        return res.status(400).send({status: 'error', msg: 'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //delete comment document
        await Comment.deleteOne({_id: comment_id, owner_id: user._id}, {new: true})
        
        //update task document
        await Task.findByIdAndUpdate({_id: task_id},
             {
                $pull: {comments: comment_id},
                $inc: {comment_count: -1}
                     }, {new: true})

        //delete all comments under the comment
        await Comment.deleteMany({replyto_comment_id: comment_id},{new: true})

        //update comment document
        await Comment.findByIdAndUpdate({_id: Mcomment_id},
            {
                $pull: {comment_replies: comment_id},
                $inc: {comment_reply_count: -1}
            }, {new: true})

        return res.status(200).send({status: 'ok', msg: 'Successfully deleted'})
        
    } catch (e) {
        console.log(e)
        if(e.name == 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }

})

module.exports = router
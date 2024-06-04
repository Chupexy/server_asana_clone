const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

const Project = require('../models/project')
const Task = require('../models/task')
const Notification = require('../models/notification')
const Section = require('../models/section')
const Comment = require('../models/comments')


//create task inside project
router.post('/create_task', async(req, res) =>{
    const {token , task_name, project_id} = req.body
    if(!token || !task_name || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {

        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        const task = new Task()
        task.user_id = user._id
        task.task_name = task_name
        task.due_date= ""
        task.assigned_to = []
        task.project = project_id
        task.description = ""
        task.timestamp = timestamp
        task.comments = []
        task.section = ""
        task.in_project = true

        await task.save()

        //update project document
        await Project.findByIdAndUpdate({_id: project_id}, {$push: {tasks: task._id}},{new: true}).lean()

         // send notification to user
      let notification = new Notification();
      notification.event = `New Task created: ${task.task_name}`;
      notification.event_id = task._id;
      notification.message = `Task successfully created ${task.task_name}`;
      notification.timestamp = timestamp;
      notification.receiver_id = user._id;
      notification.sender_id = user._id;

      await notification.save();

        return res.status(200).send({status: 'ok', msg:'Task created successful', task})


    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

//endpoint to edit task
router.post('/edit_task', async(req, res) =>{
       const {token,task_name, due_date, description, task_id, project_id} = req.body
    if(!token || !task_id || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user =jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        //get task document
        let task = await Task.findOne({_id: task_id, project: project_id}, {task_name: 1, due_date: 1, description: 1}).lean()
        if(!task)
            return res.status(200).send({status: 'ok', msg:'Task not found'})

        task = await Task.findByIdAndUpdate({_id: task_id, project: project_id}, {
            task_name: task_name || task.task_name,
            due_date: due_date || task.due_date,
            description: description || task.description
        }, {new: true}).lean()

        // send notification to user
      let notification = new Notification();
      notification.event = `Edited Task: ${task.task_id}`;
      notification.event_id = task_id;
      notification.message = `Task successfully Edited ${task.task_name}`;
      notification.timestamp = timestamp;
      notification.receiver_id = user._id;
      notification.sender_id = user._id;

      await notification.save();

        return res.status(200).send({status: 'ok', msg:'Task updated successfully', task})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//endpoint to view single task
router.post('/view_task', async(req, res) =>{
    const { token, task_id, project_id } = req.body;

    if(!token || !task_id ||!project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //find product documeent
        const task = await Task.findOne({_id: task_id, project: project_id}).lean()

        if(!task)
            return res.status(404).send({status: 'error', msg: 'Task not found'})

        return res.status(200).send({status:'ok', msg:'Task found', task})
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
            return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

// endpoint to view tasks
router.post('/view_tasks', async(req, res) =>{
    const { token, project_id } = req.body;

    if(!token || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        jwt.verify(token, process.env.JWT_SECRET)

        const tasks = await Task.find({project:project_id }).lean()
        if(tasks.length == 0)
            return res.status(400).send({status:'error', msg:'No task at the moment'});

        return res.status(200).send({status:'ok', msg:'Tasks found', tasks, count: tasks.length})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

//set priority of task in project
router.post('/set_priority', async (req,res) =>{
    const {token,  priority, task_id} =req.body
    if(!token || !priority ||!task_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        let task = await Task.findOne({_id: task_id, in_project: true}, {priority: 1}).lean()
        if(!task)
            return res.status(200).send({status: 'ok', msg: 'No task found'})

        task = await Task.findOneAndUpdate({_id: task_id, in_project: true}, {priority: priority}).lean()

        return res.status(200).send({status: 'ok', msg:'Priority Set successfully'})

    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
       return res.status(500).send({status:'error', msg:'An error occured'}) 
    }
})

//set completion status
router.post('/set_completion_status', async (req, res) =>{
    const {token, completion_status, task_id, project_id} = req.body
    if(!token || !completion_status || !task_id || !project_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        const project = await Project.findOne({_id: project_id}, {user_id: 1}).lean()
          let task = await Task.findOne({_id: task_id, in_project: true}, { task_name: 1, completion_status: 1}).lean()

          // check if you are project manager
          if(project.user_id !== user._id)
            return res.status(400).send({status:'error', msg:'Not project manager'})

        task = await Task.findByIdAndUpdate({_id: task_id}, {completion_status: completion_status}, {new: true}).lean()

        // send notification to user
      let notification = new Notification();
      notification.event = `Task completion status updated: ${task.task_name}`;
      notification.event_id = task_id;
      notification.message = `Task is ${task.completion_status}`;
      notification.timestamp = timestamp;
      notification.receiver_id = user._id;
      notification.sender_id = user._id;

      await notification.save();

        return res.status(200).send({status:'ok', msg:'Status updated'})
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
       return res.status(500).send({status:'error', msg:'An error occured'})  
    }
})

// delete task
router.post('/delete_task', async(req, res) =>{
    const {token, task_id, project_id, section_id} = req.body
    if(!token || !task_id || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //delete task from collection
        await Task.findOneAndDelete({_id: task_id, project: project_id}, {new: true})

        //update project document
        await Project.findByIdAndUpdate({_id: project_id}, {$pull: {tasks: task_id}}, {new: true})

        if(section_id){
             //update section document
        await Section.findByIdAndUpdate({_id: section_id}, {$pull: {tasks: task_id}}, {new: true})
        }
        
        //delete comments
        await Comment.deleteMany({task: task_id}, {new: true})
           

        return res.status(200).send({status: 'ok', msg: 'Successfully Deleted'})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
    }

})

module.exports = router
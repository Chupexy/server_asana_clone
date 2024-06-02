const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

const Project = require('../models/project')
const Task = require('../models/task')
const Notification = require('../models/notification')
const Section = require('../models/section')


//create task inside section
router.post('/create_task', async(req, res) =>{
    const {token , task_name, project_id, section_id} = req.body
    if(!token || !task_name || !project_id  || !section_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        // get project
        let project = await Project.findOne({_id: project_id}, {tasks: 1}).lean()
        let section = await Section.findOne({_id: section_id}, {tasks: 1}).lean()

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
        task.section = section_id
        task.in_project = true

        await task.save()

        //update project document
        project = await Project.findByIdAndUpdate({_id: project_id}, {$push: {tasks: task._id}},{new: true}).lean()
        //update section document
        section = await Section.findByIdAndUpdate({_id: section_id}, {$push: {tasks: task._id}},{new: true}).lean()

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
       const {token,task_name, due_date, description, task_id, section_id} = req.body
    if(!token || !task_id || !section_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user =jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        //get task document
        let task = await Task.findOne({_id: task_id, section: section_id}, {task_name: 1, due_date: 1, description: 1}).lean()
        if(!task)
            return res.status(200).send({status: 'ok', msg:'Task not found'})

        task = await Task.findByIdAndUpdate({_id: task_id, section: section_id}, {
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
    const { token, task_id, section_id } = req.body;

    if(!token || !task_id ||!section_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //find task documeent
        const task = await Task.findOne({_id: task_id, section: section_id}).lean()

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
    const { token, section_id } = req.body;

    if(!token || !section_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        jwt.verify(token, process.env.JWT_SECRET)

        const tasks = await Task.find({section: section_id }).lean()
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

// delete task
router.post('/delete_task', async(req, res) =>{

})


module.exports = router;
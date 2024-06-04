const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const Task = require('../models/task')
const Project = require('../models/project')
const User = require('../models/user')


router.post('/create_task', async(req, res) =>{
    const {token , task_name} = req.body
    if(!token || !task_name)
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
        task.project = ""
        task.description = ""
        task.timestamp = timestamp
        task.comments = []
        task.section = ""

        await task.save()

        //update user document
        await User.findByIdAndUpdate({_id: user._id}, {$push: {mytasks: task._id}}, {new: true}).lean()

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
       const {token,task_name, due_date, description, task_id} = req.body
    if(!token || !task_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user =jwt.verify(token, process.env.JWT_SECRET)

        //get task document
        let task = await Task.findOne({_id: task_id, user_id: user._id, in_project: false}, {task_name: 1, due_date: 1, description: 1}).lean()
        if(!task)
            return res.status(200).send({status: 'ok', msg:'Task not found'})

        task = await Task.findByIdAndUpdate({_id:  task_id}, {
            task_name: task_name || task.task_name,
            due_date: due_date || task.due_date,
            description: description || task.description
        }, {new: true}).lean()

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
    const { token, task_id } = req.body;

    if(!token || !task_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //find task documeent
        const task = await Task.findOne({_id: task_id, in_project: false}).lean()

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
    const { token } = req.body;

    if(!token)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET)

        const tasks = await Task.find({user_id: user._id, in_project: false }).lean()
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

//endpoint to set task privacy
router.post('/set_privacy', async(req, res) =>{
    const {token, privacy_status, task_id} = req.body
    if(!token || !privacy_status || !task_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)

         //get task document
         let task = await Task.findOne({_id: task_id, user_id: user._id, in_project: false}, {privacy_status: 1}).lean()

        task = await Task.findByIdAndUpdate({_id: task_id}, {privacy_status: privacy_status})

        return res.status(200).send({status:'ok', msg:'Privacy status updated'})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'}) 
    }
})

//add task to project
router.post('/add_to_project', async(req, res) =>{
    const {token , task_id, project_id} = req.body
    if(!task_id || !token || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //check task document
        await Task.findOne({_id: task_id, in_project: false})

        //get project document
        let project = await Project.findOne({_id: project_id, user_id: user._id}, {tasks: 1}).lean()
        if(!project)
            return res.status(200).send({status: 'ok', msg: 'No project found'})

        project = await Project.findOneAndUpdate({_id: project_id, user_id: user._id}, {$push: {tasks: task_id}}, {new: true}).lean()

        //update task document
        await Task.findByIdAndUpdate({_id: task_id, in_project: false}, {in_project: true, project: project_id}, {new: true})

        return res.status(200).send({status: 'ok', msg: 'Add to project successful'})
        
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
    const {token, task_id} = req.body
    if(!token || !task_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //delete task from collection
        await Task.findOneAndDelete({_id: task_id, user_id: user._id}, {new: true})

        //update user document
        await User.findByIdAndUpdate({_id: user._id}, {$pull: {mytasks: task_id}}, {new: true})

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
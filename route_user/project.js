const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

const Project = require('../models/project')
const Notification = require('../models/notification')

//endpoint to create project
router.post('/create_project', async(req, res)=>{
    const {token , project_name} = req.body
    if(!token || !project_name)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        // verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        const project = new Project()
        project.project_name = project_name
        project.user_id = user._id
        project.tasks = []
        project.sections = []
        project.timestamp = timestamp 
        project.due_date = ""
        project.project_description = ""
        project.figma_link = ""
        
        await project.save()

        // send notification to user
      let notification = new Notification();
      notification.event = `New project created : ${project.project_name}`;
      notification.event_id = project._id;
      notification.message = `You just created a project ${project.project_name}`;
      notification.timestamp = timestamp;
      notification.receiver_id = project.user_id;
      notification.sender_id = user._id;

      await notification.save();

      return res.status(200).send({status:'ok', msg:'Project Successfully created', project})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
       return res.status(500).send({status:'error', msg:'An error occured'}) 
        
    }
})


//edit project
router.post('/edit_project', async(req,res) =>{
    const {token, project_name, project_id, project_description , due_date, figma_link} = req.body
    if(!token || !project_name || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token 
        jwt.verify(token, process.env/JWT_SECRET)

        //get project document
        const project = await Project.findOne({project_id}, {project_name: 1, project_description: 1, due_date:1, figma_link: 1}).lean()

        project = await Project.findOneAndUpdate({project_id}, 
            {project_name: project_name,
             project_description: project_description,
             due_date: due_date,
             figma_link: figma_link
            }, {new: true}).lean()

        // send notification to user
      let notification = new Notification();
      notification.event = `Edited Project : ${project.project_name}`;
      notification.event_id = project._id;
      notification.message = `Edit successful ${project.project_name}`;
      notification.timestamp = timestamp;
      notification.receiver_id = project.user_id;
      notification.sender_id = user._id;

      await notification.save();

        return res.status(200).send({status: 'ok', msg:'Successful', project})

        } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'}) 
    }
})



//endpoint to view single project
router.post('/view_project', async(req, res) =>{
    const { token, project_id } = req.body;

    if(!token || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //find product documeent
        const project = await Project.findOne({_id: project_id}).lean()

        if(!project)
            return res.status(404).send({status: 'error', msg: 'Project not found'})

        return res.status(200).send({status:'ok', msg:'Project found', project})
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
            return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

// endpoint to view projects
router.post('/view_project', async(req, res) =>{
    const { token } = req.body;

    if(!token)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        jwt.verify(token, process.env.JWT_SECRET)

        const projects = await Project.find({ }).lean()
        if(projects.length == 0)
            return res.status(400).send({status:'error', msg:'No project at the moment'});

        return res.status(200).send({status:'ok', msg:'Projects found', projects, count: projects.length})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

//set privacy of project
router.post('/set_privacy', async (req,res) =>{
    const {token, privacy_status , project_id} = req.body
    if(!token || !privacy_status || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

         //get task document
         const project = await Project.findOne({project_id}, {privacy_status: 1}).lean()

        project = await Project.findByIdAndUpdate({project_id}, {privacy_status: privacy_status})

        return res.status(200).send({status:'ok', msg:'Privacy status updated'})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
       return res.status(500).send({status:'error', msg:'An error occured'}) 
    }
})


// delete project
router.post('/delete_project', async(req, res) =>{

})


module.exports = router
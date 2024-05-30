const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

const Project = require('../models/project')
const Section = require('../models/section')
const Notification = require('../models/notification')


//create section
router.post('/create_section', async(req, res) =>{
    const {token , section_name, project_id} = req.body
    if(!token || !section_name || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        // get project
        const project = await Project.findOne({project_id}, {user_id: 1, sections: 1}).lean()

        //verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const timestamp = Date.now()

        const section = new Section()
        section.user_id = user._id
        section.section_name = section_name
        section.project = project_id
        section.timestamp = timestamp
        section.tasks = []
       

        await section.save()

        //update project document
        project = await Project.findByIdAndUpdate({project_id}, {$push: {sections: section._id}},{new: true}).lean()

         // send notification to user
      let notification = new Notification();
      notification.event = `New Section created: ${section.section_name}`;
      notification.event_id = section._id;
      notification.message = `Section successfully created ${section.section_name}`;
      notification.timestamp = timestamp;
      notification.receiver_id = project.user_id;
      notification.sender_id = user._id;

      await notification.save();

        return res.status(200).send({status: 'ok', msg:'Section created successful', section})


    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

//endpoint to edit section
router.post('/edit_section', async(req, res) =>{
       const {token, section_name, section_id, project_id} = req.body
    if(!token || !section_id || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'})

    try {
        //verify token
        const user =jwt.verify(token, process.env.JWT_SECRET)

        //get section document
        const section = await Section.findOne({section_id, project: project_id}, {section_name: 1}).lean()
        if(!section)
            return res.status(200).send({status: 'ok', msg:'Section not found'})

        section = await Section.findByIdAndUpdate({section_id, project: project_id}, {
            section_name: section_name || section.section_name,
        }, {new: true}).lean()

        // send notification to user
      let notification = new Notification();
      notification.event = `Edited Section: ${section.section_name}`;
      notification.event_id = section_id;
      notification.message = `Section name changed ${section.section_name}`;
      notification.timestamp = timestamp;
      notification.receiver_id = user._id;
      notification.sender_id = user._id;

      await notification.save();

        return res.status(200).send({status: 'ok', msg:'Section updated successfully', section})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError')
            return res.status(401).send({status: 'error', msg:'Token verification failed'})

        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//endpoint to view single section
router.post('/view_section', async(req, res) =>{
    const { token, section_id, project_id } = req.body;

    if(!token || !section_id ||!project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //find section documeent
        const section = await Section.findOne({section_id, project: project_id}).lean()

        if(!section)
            return res.status(404).send({status: 'error', msg: 'Section not found'})

        return res.status(200).send({status:'ok', msg:'Section found', section})
        
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
            return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

// endpoint to view sections
router.post('/view_sections', async(req, res) =>{
    const { token, project_id } = req.body;

    if(!token || !project_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        jwt.verify(token, process.env.JWT_SECRET)

        const sections = await Section.find({project:project_id }).lean()
        if(sections.length == 0)
            return res.status(400).send({status:'error', msg:'No task at the moment'});

        return res.status(200).send({status:'ok', msg:'Sections found', sections, count: sections.length})
    } catch (e) {
        console.log(e)
        if(e.name === 'JsonWebTokenError'){
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

// Delete Section
router.post('/delete_section', async(req, res) =>{

})

module.exports = router
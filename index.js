const express = require("express");
const dotenv = require("dotenv")
const mongoose = require('mongoose');

const app = express();
dotenv.config()

mongoose.connect(process.env.MONGO_URI)
const con = mongoose.connection
con.on('open', error =>{
    if(error) {
        console.log(`Error connecting to database ${error}`)
    }else{
    console.log("Connected to Database")
    }
})



app.use(express.json());
app.use(express.urlencoded({extended: true}))

//routes
app.use('/user_auth', require('./route_user/auth'));
app.use('/user_profile', require('./route_user/profile'))
app.use('/user_tasks', require('./route_user/tasks'))
app.use('/user_comment_replies', require('./route_user/comment_replies'))
app.use('/user_comments', require('./route_user/comments'))
app.use('/user_section', require('./route_user/section'))
app.use('/user_section_task', require('./route_user/section_tasks'))
app.use('/user_project', require('./route_user/project'))
app.use('/user_project_task', require('./route_user/project_tasks'))
app.use('/user_invitation', require('./route_user/invitation'))
app.use('/user_assign_task', require('./route_user/assign_task'))

app.listen(process.env.PORT, ()=>{
    console.log("Server is running on port 3000");
})


module.exports = app;
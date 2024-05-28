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


app.listen(process.env.PORT, ()=>{
    console.log("Server is running on port 3000");
})


module.exports = app;
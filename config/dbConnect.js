const mongoose = require('mongoose')
require('dotenv').config();

function connectDB(){

mongoose.set('strictQuery',false)
mongoose.connect(process.env.MONGODB_URL).then(result=>{
     console.log("Database connected")

}).catch ((err)=>{
    console.log("database error \n" +err)
})

}

module.exports=connectDB
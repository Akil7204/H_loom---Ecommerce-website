const mongoose=require('mongoose')

const categorySchema=new mongoose.Schema({

    category:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:'unavailable'
    }
  

})

const categoryModel=mongoose.model('Category',categorySchema)

module.exports=categoryModel 
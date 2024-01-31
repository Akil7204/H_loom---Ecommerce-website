
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    category:{
        type:String,
         required:true
    },
    quantity:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    offerPrice: {
        type: Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    mainImage:{
        type:Object,
        require:true
    },
    status:{
        type:String,
        default:'available'
    },
   
})

const productModel = mongoose.model('products',productSchema)
module.exports = productModel
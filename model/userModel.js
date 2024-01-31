const mongoose=require('mongoose')

const addressSchema = {
    address: {
        type:String
    },
    
    name: {
        type:String
    },
    mobile: {
        type:Number
    },
    village: {
        type:String
    },
    landmark: {
        type:String
    },
    housename: {
        type:String
   },
   city: {
    type:String
   },
   pincode:{
    type:Number
   }

}

const userSchema=new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    confirmpassword:{
        type:String,
    },
    status : {
        type: String,
        default: "Unblock"
    },
    wishlist:{
        type:Array,
        default:[]
    },
    referralCode: { 
        type: String, default: null 
    },
   
   
    address:[addressSchema]
})
 
const userModel = mongoose.model('users',userSchema)
module.exports=userModel
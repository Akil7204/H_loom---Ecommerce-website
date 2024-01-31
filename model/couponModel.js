
const mongoose  = require('mongoose')
const couponSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    couponCode:{
        type:String,
        required:true
    },
    minimumAmount:{
        type:Number,
        required:true
    },
    couponAmount:{
        type:Number,
        required:true
    },
    startDate:{
        type:Date,
        required:true,
        default: new Date().toLocaleString()
    },
    expiryDate:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        default:'available'
    },
    usedUsers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
          ref: "user",
        },
      ],
      
});

const couponModel = mongoose.model("coupon", couponSchema)
module.exports = couponModel
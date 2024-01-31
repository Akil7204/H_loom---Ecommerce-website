const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    //    orderItems:{
    //    type:Array,
    //    },

    //    address:{
    //     type:Object
    //    },

    //    status:{
    //     type:String,
    //     default:"pending"
    //    },

    //    totalPrice:{
    //     type:Number
    //    },

    //    dateOrdered:{
    //     type:Date,
    //     default:Date()
    //    },

    //    dateDelivered:{
    //       type:Date,
    //       default: new Date(new Date().setDate(new Date().getDate() + 7))
    //    },

    //    userId:{
    //       type:String
    //    },

    //    quantity:{
    //       type:Number
    //    },

    //    paymentType:{
    //       type:String
    //    },

    //    discount:{
    //       type:Number,
    //       default:0
    //    },

    return: {
      type: Boolean,
      default: false,
    },

    //    quantity:{
    //       type:Number,
    //       required:true
    //    },

   

    userId: { type: mongoose.Types.ObjectId, required: true, ref: "users" },

    orderNumber: { type: Number, required: true },

    orderDate: {
      type: Date,
      required: true,
      default: Date(),
    },

    paymentType: { type: String },

    orderStatus: { type: String, default: "Pending" },

    address: {
      type: Object,
    },

    cartData: { type: Array },

    grandTotalCost: { type: Number },

    paymentId: { type: String },

    paid: {
      type: Boolean,
      required: true,
    },

    cancel: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }
);

const orderModel = mongoose.model("orders", orderSchema);
module.exports = orderModel;

// dateDelivered:{
//    type:Date,
//    default: new Date(new Date().setDate(new Date().getDate() + 7))
// },

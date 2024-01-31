const cartModel = require("../model/cartModel");
const orderModel = require("../model/orderModal");
const productModel = require("../model/productModel");
const walletModel=require('../model/walletModel')
const Razorpay=require('razorpay');

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});


const order = {
  
  place: async (req, res) => {
    try {
      let flag = 0,
        stockOut = [];
      const address = req.body.address;
      const total = req.body.total;
      const paymentMethod = req.body.paymentmethod;
      const user = req.session.user_id;
      const cart = await cartModel
        .findOne({ userId: user })
        .populate("products.item");
      cart.products.forEach(async (product) => {
        const pro = await productModel.findOne({ _id: product.item });
        if (product.quantity > pro.quantity) {
          flag = 1;
          stockOut.push({ name: pro.productname, available: pro.quantity });
        }
      });
      if (flag == 0) {
        const orderdetail = new orderModel({
          userId: user,
          total: total,
          paymentmethod: paymentMethod,
          address: address,
        });
        if(paymentMethod!="COD"){
          orderdetail.paymentStatus="Paid"
        }
        cart.products.forEach(async (product) => {
          let qty = product.quantity;
          let idpro = product.item;
          orderdetail.product.push({
            product_id: idpro,
            quantity: qty,
          });
          await productModel.updateOne(
            { _id: idpro },
            { $inc: { quantity: -qty } }
          );
        });

        await orderdetail.save();
        await cartModel.findOneAndDelete({ userId: user });
        console.log("hooooooooooooo");
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
    res.render('error', { error: error.message });
     
    }
  },
  createOrder: async (req, res) => {
    try {
      const user = req.session.user_id;
      let amount = parseInt(req.body.amount) *100;
      console.log(amount);
      const options = {
        amount: amount,
        currency: "INR",
        receipt: "aleenavincent4u@gmail.com",
      };
      razorpayInstance.orders.create(options, (err, order) => {
        if (!err) {
          console.log('no error')
          res.status(200).send({
            success: true,
            msg: "Order Created",
            amount: amount,
            key_id: RAZORPAY_ID_KEY,
            contact: "7306015174",
            name: user.name,
            email: "aleenavincent4u@gmail.com",
          });
         
        } else {
          console.log("else")
          res
            .status(400)
            .send({ success: false, msg: "Something went wrong!" });
         
        }
      });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
  // ------------admin side---------------

  load_order: async (req, res) => {
    console.log("hiii")
    try {

      const order_details = await orderModel.find({}).populate("userId").exec();
      // console.log(order_details)
      res.render("order", { order: order_details });
    } catch (error) {
      console.log(error.message)
      res.render('error', { error: error.message })
    }
  },

  // -----------ORDER HISTORY IN USER SIDE--------


  order_details: async (req, res) => {
    try {
      const orderid = req.query.id;
      console.log(orderid)
      const order_details = await orderModel.findById({ _id: orderid })

        .populate("product.product_id")
        .populate("address")
        .populate("userId")
        .exec();
      res.render("orderdetails1", { order: order_details });
    } catch (error) {
      res.render('error', { error: error.message })
    }
  },


  // ---------------cancelling the order-------------- 

  // cancel_order: async (req, res) => {
  //   try {
  //     const orderId = req.query.id;
  //     console.log(orderId)
  //     if (orderId) {
  //       const orderItem = await orderModel.findByIdAndUpdate(
  //         orderId,
  //         { $set: { status: "Cancelled" } },
  //         { new: true } // To get the updated order object in the response
  //       );
  //       console.log(orderId)
  //       if (orderItem) {
  //         return res.send({ message: "order cancelled" }); // Order status is updated
  //       } else {
  //         return res.send({ message: "order not found" }); // Order not found
  //       }
  //     } else {
  //       return res.send({ message: "something wrong" }); // Invalid or missing orderId
  //     }
  //   } catch (error) {
  //     console.error("Error cancelling order:", error);
  //     return res.status(500).send({ message: "Error cancelling order" });
  //   }
  // },
   cancel_order : async (req, res) => {
    console.log("OOOOOOOOOOOOOOOOOO") 
    const user = req.session.user_id;
    const orderId = req.body.id;
    try {
      let order = await orderModel.findById(orderId);
      if (order.paymentmethod !== "COD") {
        const userwallet = await walletModel.findOne({ userid: user });
        if (userwallet) {
          await walletModel.findByIdAndUpdate(
            userwallet._id,
            {
              $inc: { balance: order.total },
              $push: {
                orderDetails: {
                  orderid: orderId,
                  amount: order.total,
                  type: "Added",
                  date: new Date(),
                },
              },
            },
            { new: true }
          );
        } else {
          console.log("hi");
          let wallet = new walletModel({
            userid: user,
            balance: order.total,
            orderDetails: [
              {
                orderid: orderId,
                amount: order.total,
                type: "Added",
                date: new Date(),
              },
            ],
          });
          console.log(wallet);
          await wallet.save();
        }
      }
  
      for (const products of order.product) {
        await productModel.findByIdAndUpdate(
          products.productid,
          { $inc: { quantity: products.quantity } },
          { new: true }
        );
      }
  
      order = await orderModel.findByIdAndUpdate(
        orderId,
        { status: "Cancelled" },
        { new: true }
      );
  
      if (order) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
      // console.log('error',{error:error.message})
    }
  },
  



  // -----------order details in user side------------


  orderDetails: async (req, res) => {
    try {
      const orderid = req.query.id;
      console.log("order id is..." + orderid)
      const order_details = await orderModel.findById({ _id: orderid })

        .populate("product.product_id")
        .populate("address")
        .populate("userId")
        .exec();
      res.render("orderDetails", { order: order_details ,user:req.session.user_id});
      console.log(order_details)
    } catch (error) {
      res.render('error', { error: error.message });

    }
  },

   status_update :async (req, res) => {
    try {
      const orderid = req.body.orderid;
      console.log(orderid)
      const status = req.body.status;
      console.log( "status is "+status)
      const order_update = await orderModel.findByIdAndUpdate(
        { _id: orderid },
        { $set: { status: status } }
      );
      console.log(order_update)
      if (order_update) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render('error', { error: error.message });

    }
  },



returnRequest: async(req, res) => {
  const orderid = req.body.id;
  try {
    let order = await orderModel.findByIdAndUpdate(
      { _id: orderid },
      { status: "Return Requested" },
      { new: true }
    );
    if (order) {
      res.send({ message: "1" });
    } else {
      res.send({ message: "0" });
    }
  } catch (error) {
    res.render('error', { error: error.message });

  }
},

approveReturn: async (req, res) => {
  console.log("kkkkkkkkkkkkkk")
  const user = req.session.user_id;
  console.log(user)
  const orderId = req.body.id;
  console.log(orderId)
  try {
    let order = await orderModel.findById(orderId);
    const userwallet = await walletModel.findOne({ userid: user });
    if (userwallet) {
      await walletModel.findByIdAndUpdate(
        userwallet._id,
        {
          $inc: { balance: order.total },
          $push: {
            orderDetails: {
              orderid: orderId,
              amount: order.total,
              type: "Added",
            },
          },
        },
        { new: true }
      );
    } else {
      let wallet = new walletModel({
        userid: user,
        balance: order.total,
        orderDetails: [
          {
            orderid: orderId,
            amount: order.total,
            type: "Added",
          },
        ],
      });
      await wallet.save();
    }
    for (const product of order.product) {
      await productModel.findByIdAndUpdate(
        product.productid,
        {
          $inc: { productquantity: product.quantity },
        },
        { new: true }
      );
    }
    order = await orderModel.findByIdAndUpdate(
      orderId,
      { paymentStatus: "Refund" },
      { new: true }
    );
    order = await orderModel.findByIdAndUpdate(
      orderId,
      { status: "Returned" },
      { new: true }
    );
    if (order) {
      res.send({ message: "1" });
    } else {
      res.send({ message: "0" });
    }
  } catch (error) {
    res.render('error', { error: error.message });

  }
},


status_update :async (req, res) => {
  try {
    const orderid = req.body.orderid;
    console.log(orderid)
    const status = req.body.status;
   
    if(status=="Delivered"){
      const order_update = await orderModel.findByIdAndUpdate(
          { _id: orderid },
          { $set: { status: status ,paymentstatus:"Paid"} }
        );
    }else{
      const order_update = await orderModel.findByIdAndUpdate(
        { _id: orderid },
        { $set: { status: status }}
      );
    }
    res.send({ message: "1" });
  } catch (error) {
    res.render('error', { error: error.message });

  }
},
}
module.exports = order;
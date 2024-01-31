const order=require('../model/order')
const walletModel=require('../model/walletModel')


const wallet=async(req,res)=>{
    res.render('wallet')
    
}


  
  module.exports={
    wallet,
  }
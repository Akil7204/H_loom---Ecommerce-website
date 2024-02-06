const express=require('express')
const controller=require('../controllers/userController')
// const VerifyUser=require('../middlewares/verifyUser')
const router=express()
const userAuth = require('../middleware/userAuth.js')


router.set('view engine','ejs')
router.set('views', './views/User');


router.get('/', controller.userLogin)
router.get('/login', controller.login)
router.post('/login', controller.userVerfication)
router.get('/signup', controller.getSignupPage)
router.post('/signup',controller.postSignupPage)


// ----------------------OTP-----------------------
// router.get('/otp',controller.getVerifyOtp)
router.post('/otp',controller.postVerifyOtp)
router.get('/resendOTP',controller.resendotp)



// -------------------------------------FORGOT PASSWORD----------------------------------------------

router.get("/forgotpassword", controller.forgotPage);
router.get("/frgtpswd", controller.forgetPassword);
router.post("/frgtpswd", controller.forgetPassword);
router.post("/verifyOTPFP", controller.verifyOTPFP);
router.get("/resetPassword", controller.resetPW);
router.post("/resetPassword", controller.resetPassword);




// ---------------product page---------------------

router.get('/product',controller.productspage)
router.get('/shop/filter/category/:categoryName', controller.filterCategory)
router.get('/productView/:id',controller.getproductDetails)
router.get('/shop/filter/priceRange', controller.filterPriceRange)
router.get('/shop/sort/priceAscending', controller.sortPriceAscending)
router.get('/shop/sort/priceDescending', controller.sortPriceDescending)




// ----------------------cart-------------------------------

router.get("/cart", userAuth, controller.getCartPage);
router.post("/addto-cart/:id",userAuth, controller.addtoCart);
router.delete('/cart/delete/:id', controller.deleteFromCart);
// router.get("/remove-cart/:id",userAuth, controller.removeCart);
router.put('/cart/decQty/:id', userAuth, controller.decQty)
router.put('/cart/incQty/:id', userAuth, controller.incQty)
router.post('/applyPromo', userAuth, controller.applyPromo)
router.post('/checkout/applyCoupon', userAuth, controller.applyCoupon)


// ----------------------check out-------------------------

router.get("/checkout-payment",userAuth, controller.getcheckout);
router.get("/payment/:id",userAuth, controller.getpayment);
router.post('/review',userAuth, controller.getreview);
router.post('/genOrder', userAuth, controller.GenerateOrder)
router.all("/product-checkout",userAuth, controller.postCheckout);
router.get('/checkout-5',userAuth, controller.getoderplaced)
router.post('/checkvalidcoupon',controller.checkvalid_Coupon)


// ------------------oder-------------------------

router.get("/orders",userAuth, controller.getOrders);
router.get('/orderDetails/:id',userAuth, controller.orderDetails)
router.post('/cancelorder', controller.cancel_order)
router.post('/returnorder', controller.returnRequest)


// ----------------------profile-------------------------

router.get('/profile', userAuth, controller.getuserProfile)
router.get('/dashboard', userAuth, controller.getuserdashboard)
router.get('/address', userAuth, controller.getuseraddress)
router.get('/add-address', userAuth, controller.getAddress)
router.post('/add-address', userAuth, controller.postAddress)
router.get('/edit-address/:id', userAuth, controller.getEditAddress)
router.post('/edit-address/:id', userAuth, controller.posteditAddress)

router.get('/delete-address/:id', userAuth,controller.deleteAddress)

// --------------------------wallet--------------------------

router.get( '/wallet', userAuth, controller.getWalletHistory )

// -----------------------pdf invoice-----------------------------
router.get("/invoice/:id", userAuth, controller.invoiceDownloadController);



//  -------------------------LOgout----------------------------
router.get('/logout', controller.logout)







module.exports = router;




// Key id : rzp_test_PwI6HFeewvqmlD
// secret key : wjnzNdFW5HWiHIOYYOQvm014






// router.get("/wishlist", controller.wishlist);
// router.get("/addto-wishlist/:id", controller.addtowishList);
// router.get("/remove-wishlist/:id", controller.removeWishlist);
const express=require('express')
const controller=require('../controllers/adminController')
const adminModel=require('../model/adminModel')
const userModel=require('../model/userModel')
const router=express()
const adminAuth = require('../middleware/adminAuth.js')
// const VerifyAdmin=require('../middleware/verifyAdmin')
const upload = require('../middleware/multer')


router.set('view engine', 'ejs');
router.set('views', './views/Admin');


router.get('/admin',controller.adminHome)
router.get('/login',controller.adminLogin)
router.post('/admin',controller.postadminLogin)

// -------------------ADMIN dashboard---------------------------
router.get('/dashboardData', adminAuth, controller.dashboardData )
// router.get( '/getAdmin',  controller.getAdminHome )

// ------------------Admin pages-----------------

router.get('/productMngt',adminAuth, controller.productMngt)
router.get('/orderMngt',adminAuth, controller.orderMngt)
router.get('/categoryMngt',adminAuth, controller.categoryMngt)
router.get('/userMngt',adminAuth, controller.userMngt)
router.get('/couponMngt',controller.couponMngt)
router.get('/adminlogout',controller.adminLogout)


//---------------------------sales report---------------------------------

router.get('/salesReport', adminAuth, controller.salesReport)
router.post('/salesReport/filter', adminAuth, controller.salesReportFilter)

// ----------------------coupen page------------------------------

router.get('/addCoupon',controller.getaddCoupon)
router.post('/addCoupon',controller.postAddCoupon)
router.get('/editCoupon/:id',controller.editCoupon)
router.post('/editCoupon/:id',controller.posteditCoupon)
router.post('/list-coupon/:id',controller.listCoupon)
router.post('/unlist-coupon/:id',controller.unlistCoupon)



// ----------------------user block---------------------

router.post('/block-user/:id',controller.getuserBlock)
router.post('/unblock-user/:id',controller.getuserUnblock)

// -----------------------product page-------------------

router.get('/addProducts',adminAuth,controller.getaddproduct)
// router.post('/addproducts', upload.fields([{name:'images', maxCount:5}]), controller.add_product)
router.post("/add-product", adminAuth, upload.any(), controller.addProductController);
router.get('/productEdit/:id',adminAuth, controller.editProduct)
// router.post('/productEdit/:id',upload.array('images'), controller.update_product)
router.post("/edit-product", adminAuth, upload.any(), controller.editProductController);
router.post('/list-product/:id',controller.listProduct)
router.post('/unlist-product/:id',controller.unlistproduct)


// --------------------order------------------------

router.get('/orderdetail/:id',adminAuth, controller.order_details);
router.get('/orderManagement/status/pending/:id',adminAuth,  controller.changeStatusPending)
router.get('/orderManagement/status/shipped/:id',adminAuth, controller.changeStatusShipped)
router.get('/orderManagement/status/delivered/:id',adminAuth,  controller.changeStatusDelivered)
router.get('/orderManagement/status/return/:id',adminAuth,  controller.changeStatusReturn)
router.get('/orderManagement/status/cancelled/:id',adminAuth,  controller.changeStatusCancelled)


// --------------------------------------------category page------------------------------------------------------

router.get('/addCategory',controller.getaddcategory)
router.post('/addCategory',controller.postAddCategory)

router.get('/edit-category/:id', controller.geteditcategory)
router.post('/edit-category/:id',controller.posteditCategory)

router.post('/list-category/:id',controller.listcategory)
router.post('/unlist-category/:id',controller.unlistcategory)


// ------------------------------------offer modules------------------------------------------------

router.get( '/offers', adminAuth, controller.getOfferPage )
router.get( '/add-offer', adminAuth, controller.getAddOffer )
router.post("/add-product-offer", adminAuth, controller.addProductOfferController)
router.get("/edit-product-offer/:id", adminAuth, controller.getEditOffer)
router.put("/edit-product-offer",adminAuth, controller.editProductOffer)
router.get("/productoffer-status/:id",adminAuth, controller.editProductOfferStatus)


// -----------------------------------category Offer-------------------------------

router.get( '/categoryoffers', adminAuth, controller.getcategoryoffer )
router.get( '/categoryadd-offer', adminAuth, controller.getAddcategoryOffer )
router.post("/add-category-offer", adminAuth, controller.addCategoryOffer);
router.get("/categoryoffer-status/:id", adminAuth, controller.editCategoryOfferStatus);

















// router.post( '/add-offer', adminAuth, controller.addOffer )
// router.get( '/edit-offer/:id', adminAuth, controller.getEditOffer )
// router.post( '/edit-offer', adminAuth, controller.editOffer )
// router.patch( '/cancel-offer', adminAuth, controller.cancelOffer )
// // router.patch( '/apply-product-offer', adminAuth, controller.applyProductOffer )
// router.patch( '/remove-product-offer', adminAuth, controller.removeProductOffer )
// router.patch( '/apply-category-offer', isAuth.adminAuth, categoryController.applyCategoryOffer )
// router.patch( '/remove-category-offer', isAuth.adminAuth, categoryController.removeCategoryOffer )





module.exports=router
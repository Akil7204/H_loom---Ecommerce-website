const adminModel = require("../model/adminModel");
const adminRouter = require("../routers/adminRouter");
const userModel = require("../model/userModel");
const categoryModel = require("../model/categoryModel");
const productModel = require("../model/productModel");
const couponModel = require("../model/couponModel");
// const bannerModel = require('../models/bannerModel')
const {
  applyProductOffer,
  applyCategoryOffer,
} = require("../helpers/applyProductOffers.js");
const orderModel = require("../model/orderModel");
const offerModel = require("../model/productOfferModel");
const dashboardHelper = require("../helpers/dashboardHelper");
const categoryOfferModel = require("../model/categoryOfferModel");

const sharp = require("sharp");
const fs = require("fs");

const adminHome = (req, res) => {
  if (req.session.admin) {
    res.render("adminHome");
  } else {
    res.render("adminLogin");
  }
};

const adminLogin = (req, res) => {
  if (req.session.admin) {
    res.redirect("/");
  } else {
    res.render("adminLogin");
  }
};

const postadminLogin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await adminModel.findOne({ email });

  if (admin) {
    if (password == admin.password) {
      req.session.admin = {
        name: admin.name,
      };
      console.log(req.session.admin);
      res.redirect("/admin");
    } else {
      res.render("adminLogin", { err: "incorrect password" });
    }
  } else {
    res.render("adminLogin", { error: "please enter all fields" });
  }
};

const productMngt = async (req, res) => {
  try {
    id = req.params.id;
    // let products = await productModel.find({})
    let categories = await categoryModel.find({});
    const availableOffers = await offerModel.find({
      status: true,
      expiryDate: { $gte: new Date() },
    });
    req.session.pageNum = parseInt(req.query.page ?? 1);
    req.session.perpage = 4;
    let products = await productModel
      .find()
      .countDocuments()
      .then((documentCount) => {
        docCount = documentCount;
        return productModel
          .find()
          .skip((req.session.pageNum - 1) * req.session.perpage)
          .limit(req.session.perpage)
          .lean();
      });
    username = req.session.user;
    let pageCount = Math.ceil(docCount / req.session.perpage);
    let pagination = [];
    for (i = 1; i <= pageCount; i++) {
      pagination.push(i);
    }

    res.render("productMngt", {
      products,
      categories,
      pagination,
      availableOffers: availableOffers,
      user: req.session.admin,
    });
  } catch (err) {
    console.log(err);
  }
};

const userMngt = async (req, res) => {
  let users = await userModel.find({}, { password: 0 }).lean();
  // console.log(users)

  res.render("userMngt", { users });
};

const categoryMngt = async (req, res) => {
  const categories = await categoryModel.find().lean();
  res.render("categoryMngt", { categories });
};

const getuserBlock = async (req, res) => {
  var id = req.params.id;
  console.log(id);

  await userModel
    .findByIdAndUpdate(id, { $set: { status: "block" } })
    .then(() => {
      res.redirect("/userMngt");
    })
    .catch((err) => {
      console.log(err);
    });
};

const getuserUnblock = async (req, res) => {
  var id = req.params.id;
  console.log(id);

  await userModel
    .findByIdAndUpdate(id, { $set: { status: "Unblock" } })
    .then(() => {
      res.redirect("/userMngt");
    })
    .catch((err) => {
      console.log(err);
    });
};

const getaddproduct = async (req, res) => {
  const categories = await categoryModel.find({}).lean();

  console.log(categories);
  res.render("addProducts", { categories });
};

const add_product = async (req, res) => {
  try {
    const { name, category, quantity, price, brand, description } = req.body;

    // Check if required fields are missing
    if (!name || !category || !quantity || !price || !brand || !description) {
      const fieldRequired = "All Fields Are Required";
      const categories = await categoryModel.find().lean();
      return res.render("addProducts", { fieldRequired, categories });
    }

    // Check if files are present in the request
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      const noImagesError = "At least one image is required";
      const categories = await categoryModel.find().lean();
      return res.render("addProducts", { noImagesError, categories });
    }

    // Image Processing
    const processedImages = await Promise.all(
      req.files.images.map(async (image) => {
        await sharp(image.path)
          .png()
          .resize(600, 600, {
            kernel: sharp.kernel.nearest,
            fit: "contain",
            position: "center",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .toFile(image.path + ".png");

        image.filename = image.filename + ".png";
        image.path = image.path + ".png";

        return image.filename;
      })
    );

    // Create Product Object
    const product = new productModel({
      name,
      category,
      quantity,
      price,
      offerPrice: price,
      brand,
      description,
      mainImage: processedImages,
    });

    console.log(product);

    // Save Product to Database
    await product.save();
    console.log("Product saved successfully");

    // Send a success response
    return res.redirect("/productMngt");
  } catch (error) {
    // Handle the error
    console.error(error.message);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

const addProductController = async (req, res) => {
  try {
    const { productName, price, category, quantity, brand, description } = req.body;
    const images = req.files.map((m) => m.filename);

    const product = await new productModel({
      name: productName,
      price,
      brand,
      offerPrice: price,
      category,
      quantity,
      description,
      mainImage:images,
    }).save();
    res.status(200).send({ success: true });
  } catch (error) {
    console.log("error in adding product ", error);
    res.status(500).send({ success: false });
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const products = await productModel.findOne({ _id: id });
    console.log(products);

    const categories = await categoryModel.find({});
    console.log(categories);

    res.render("productEdit", { products, categories });
  } catch (err) {
    console.log(err);
  }
};

const editProductController = async (req, res) => {
  try {
    const { productName, price, category, quantity, description, id, brand } =
      req.body;
    const images = req.files.map((m) => m.filename);

    await productModel.updateOne(
      { _id: id },
      {
        $set: {
          name: productName,
          price,
          offerPrice: price,
          category,
          brand,
          quantity,
          description,
        },
      }
    );

    for (let i = 0; i < req.files.length; i++) {
      if (req.files[i].fieldname === "image1") {
        await productModel.updateOne(
          { _id: id },
          {
            $set: { ["mainImage.0"]: req.files[i].filename },
          }
        );
      }
      if (req.files[i].fieldname === "image2") {
        await productModel.updateOne(
          { _id: id },
          {
            $set: { ["mainImage.1"]: req.files[i].filename },
          }
        );
      }
      
      
    }

    res.redirect("/productMngt");
  } catch (error) {
    console.log("error in updating image ", error);
  }
};

// const update_product = async (req, res) => {
//   try {
//     console.log("update_product");
//     let dataobj;
//     console.log(req.body);

//     const images = [];
//     if (req.files) {
//       for (let i = 0; i < req.files.length; i++) {
//         images[i] = req.files[i].filename;
//       }
//       dataobj = {
//         productname: req.body.productname,
//         category: req.body.category,
//         brand: req.body.brand,
//         quantity: req.body.quantity,
//         price: req.body.price,
//         offerPrice: req.body.price,
//         description: req.body.description,
//         mainImage: images,
//       };
//     } else {
//       dataobj = {
//         name: req.body.productname,
//         category: req.body.category,
//         brand: req.body.brand,
//         quantity: req.body.quantity,
//         price: req.body.price,
//         offerPrice: req.body.price,
//         description: req.body.description,
//       };
//     }
//     // console.log(dataobj);
//     await product.findByIdAndUpdate(
//       { _id: req.body.id },
//       { $set: dataobj },
//       { new: true }
//     );

//     res.redirect("/productMngt");
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send({ success: false, msg: error.message });
//   }
// };

const listProduct = async (req, res) => {
  var id = req.params.id;
  console.log(id);

  await productModel
    .findByIdAndUpdate(id, { $set: { status: "available" } })
    .then(() => {
      res.redirect("/productMngt");
    })
    .catch((err) => {
      console.log(err);
    });
};

const unlistproduct = async (req, res) => {
  var id = req.params.id;
  console.log(id);

  await productModel
    .findByIdAndUpdate(id, { $set: { status: "unavailable" } })
    .then(() => {
      res.redirect("/productMngt");
    })
    .catch((err) => {
      console.log(err);
    });
};

const getaddcategory = (req, res) => {
  res.render("addCategory");
};

const postAddCategory = async (req, res) => {
  const category = req.body.category.toLowerCase();
  const categories = await categoryModel.findOne({ category });
  console.log(categories);

  if (categories) {
    return res.render("addCategory", {
      error: true,
      duplicate: "category already exist",
    });
  }
  if (category == "" || category == null) {
    return res.redirect("/addCategory");
  } else {
    // const category = req.body.Category
    console.log(req.body);

    const categories = new categoryModel({ category });

    categories.save();

    res.redirect("/categoryMngt");
  }
};

const listcategory = async (req, res) => {
  var id = req.params.id;
  console.log(id);

  await categoryModel
    .findByIdAndUpdate(id, { $set: { status: "available" } })
    .then(() => {
      res.redirect("/categoryMngt");
    })
    .catch((err) => {
      console.log(err);
    });
};

const unlistcategory = async (req, res) => {
  var id = req.params.id;
  console.log(id);

  await categoryModel
    .findByIdAndUpdate(id, { $set: { status: "unavailable" } })
    .then(() => {
      res.redirect("/categoryMngt");
    })
    .catch((err) => {
      console.log(err);
    });
};

const posteditCategory = async (req, res) => {
  try {
    const categoryExist = await categoryModel.findOne({
      category: req.body.category,
    });

    if (!categoryExist || req.params.id == categoryExist.id) {
      await categoryModel.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { category: req.body.category } }
      );
      const categories = await categoryModel.find({});
      res.render("categoryMngt", { categories });
    } else {
      const categories = await categoryModel.find({});
      res.render("editCategory", {
        categories,
        duplicate: "category already exist",
      });
    }
  } catch (err) {
    console.log(err);
  }
};

const geteditcategory = async (req, res) => {
  console.log(req.params.id);
  const categories = await categoryModel.findOne({ _id: req.params.id });
  console.log(categories);
  res.render("editCategory", { categories });
};

// -----------------------------order----------------------------

const orderMngt = async (req, res) => {
  try {

    let orders;
    let count;
    let page = Number(req.query.page) || 1;
    let limit = 8;
    let skip = (page - 1) * limit;

    if (req.session.orderList) {
      orders = req.session.orderList;
    } else {
      count = await orderModel.find().estimatedDocumentCount();

      orders = await orderModel.find().skip(skip).limit(limit);
    }

    res.render("orderMngt", { order:orders, count, limit });
    req.session.orderList = null;
    req.session.save();
    
  } catch (err) {
    console.log("ful err");
    console.log(err);
  }
};

const order_details = async (req, res) => {
  try {
    const orderid = req.params.id;

    const order_details = await orderModel.findById({ _id: orderid });
    let userId = order_details.userId;
    const user = await userModel.findById({ _id: userId });

    res.render("detailsOrder", { order: order_details, user });
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

const status_update = async (req, res) => {
  try {
    const orderid = req.body.orderid;
    console.log(orderid);
    const status = req.body.status;
    console.log("status is " + status);
    const order_update = await orderModel.findByIdAndUpdate(
      { _id: orderid },
      { $set: { orderStatus: status } }
    );
    console.log(order_update);

    res.render("orderMngt", { message: "1" });
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

//   ------------------------------------------------------------------------------------------------------

// const orderStatus = async (req, res) => {
//     try {

//         const orderId = req.body.orderId;
//         const orderStatus = req.body.orderStatus;
//         const paymentStatus = req.body.paymentStatus;

//         const updatedOrder = await orderModel.findByIdAndUpdate(orderId, {
//             Order_status: orderStatus,
//             Payment_status: paymentStatus
//         }, { new: true });

//         res.json(updatedOrder);

//     } catch (error) {
//         console.error('Error updating order status:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// }

const changeStatusPending = async (req, res) => {
  try {
    await orderModel.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { orderStatus: "Pending" } }
    );
    res.redirect("/orderMngt");
  } catch (error) {
    console.error(error);
  }
};

const changeStatusShipped = async (req, res) => {
  try {
    console.log(req.params.id);
    const aaaa = await orderModel.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { orderStatus: "Shipped" } }
    );
    console.log(aaaa);
    res.redirect("/orderMngt");
  } catch (error) {
    console.error(error);
  }
};

const changeStatusDelivered = async (req, res) => {
  try {
    await orderModel.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { orderStatus: "Delivered", paid: true } }
    );

    res.redirect("/orderMngt");
  } catch (error) {
    console.error(error);
  }
};

const changeStatusReturn = async (req, res) => {
  try {
    await orderModel.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { orderStatus: "Return" } }
    );
    res.redirect("/orderMngt");
  } catch (error) {
    console.error(error);
  }
};

const changeStatusCancelled = async (req, res) => {
  try {
    await orderModel.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { orderStatus: "Cancelled" } }
    );
    res.redirect("/orderMngt");
  } catch (error) {
    console.error(error);
  }
};

const adminLogout = (req, res) => {
  req.session.admin = false;
  res.redirect("/admin");
};

// ----------------------------------------coupen mangment--------------------------

const couponMngt = async (req, res) => {
  let coupon = await couponModel.find({});
  res.render("couponMngt", { coupon });
};

const getaddCoupon = (req, res) => {
  res.render("addCoupon");
};

const postAddCoupon = async (req, res) => {
  const { name, discountprice, min_purchase, expiryDate, startDate, code } =
    req.body;
  // console.log(req.body)
  let start = new Date(startDate);
  let end = new Date(expiryDate);
  console.log(start);
  console.log(end);

  const coupons = await couponModel.findOne({ couponCode: code });
  if (coupons) {
    const fieldRequired = "Coupon code already exist";
    return res.render("addCoupon", { fieldRequired });
  }

  // Check if required fields are missing
  if (
    !name ||
    !discountprice ||
    !min_purchase ||
    !expiryDate ||
    !startDate ||
    !code
  ) {
    const fieldRequired = "All Fields Are Required";
    return res.render("addCoupon", { fieldRequired });
  } else if (start > end) {
    const Required = "The end date should be after the today's date";
    return res.render("addCoupon", { Required });
    //   } else if( maxAmount > minAmount) {
    //     const fieldRequired = "The maxAmount should be grater than minimum amount!!!";
    //     return res.render("addCoupon", { fieldRequired });
  } else {
    const coupon = new couponModel({
      name: name,
      couponAmount: discountprice,
      minimumAmount: min_purchase,
      expiryDate: expiryDate,
      startDate: startDate,
      couponCode: code,
    });

    coupon.save();
    console.log("Coupon saved successfully");
    res.redirect("/couponMngt");
  }
};

const editCoupon = async (req, res) => {
  const coupon = await couponModel.findOne({ _id: req.params.id });
  console.log(coupon);

  res.render("editCoupon", { coupon });
};

const posteditCoupon = async (req, res) => {
  try {
    const { name, discountprice, min_purchase, startDate, expiryDate, code } =
      req.body;
    const id = req.params.id;
    const couponExist = await couponModel.findOne({
      code: code,
    });

    if (!couponExist || id == couponExist._id) {
      await couponModel.findOneAndUpdate(
        { _id: req.params.id },
        {
          $set: {
            name,
            discountprice,
            min_purchase,
            startDate,
            expiryDate,
            code,
          },
        }
      );
      res.redirect("/couponMngt");
    } else {
      res.render("editCoupon", {
        coupon: couponExist,
        duplicate: "category already exist",
      });
    }
  } catch (err) {
    console.log(err);
  }
};

const listCoupon = async (req, res) => {
  var id = req.params.id;
  console.log(id);

  await couponModel
    .findByIdAndUpdate(id, { $set: { status: "available" } })
    .then(() => {
      res.redirect("/couponMngt");
    })
    .catch((err) => {
      console.log(err);
    });
};

const unlistCoupon = async (req, res) => {
  var id = req.params.id;
  console.log(id);

  await couponModel
    .findByIdAndUpdate(id, { $set: { status: "unavailable" } })
    .then(() => {
      res.redirect("/couponMngt");
    })
    .catch((err) => {
      console.log(err);
    });
};
const dashboardData = async (req, res) => {
  try {
    const [
      productsCount,
      categoryCount,
      pendingOrdersCount,
      completedOrdersCount,
      currentDayRevenue,
      fourteenDaysRevenue,
      categoryWiseRevenue,
      TotalRevenue,
      MonthlyRevenue,
      Activeuser,
    ] = await Promise.all([
      dashboardHelper.productsCount(),
      dashboardHelper.categoryCount(),
      dashboardHelper.pendingOrdersCount(),
      dashboardHelper.completedOrdersCount(),
      dashboardHelper.currentDayRevenue(),
      dashboardHelper.fourteenDaysRevenue(),
      dashboardHelper.categoryWiseRevenue(),
      dashboardHelper.Revenue(),
      dashboardHelper.MonthlyRevenue(),
      dashboardHelper.Activeuser(),
    ]);

    const data = {
      productsCount,
      categoryCount,
      pendingOrdersCount,
      completedOrdersCount,
      currentDayRevenue,
      fourteenDaysRevenue,
      categoryWiseRevenue,
      TotalRevenue,
      MonthlyRevenue,
      Activeuser,
    };

    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

// --------------------------------sales Report-------------------------------

const salesReport = async (req, res) => {
  try {

    if (req.session?.adminuser?.salesData) {
      let { salesData, dateValues } = req.session.adminuser;
      return res.render("sales-report", { salesData, dateValues });
    }
    let salesData = await orderModel.find().populate("userId");

    res.render("sales-report", { 
      salesData,
      dateValues: null,
    });

  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).send("Internal Server Error");
  }
};

const salesReportFilter = async (req, res) => {
  try {
    let { startDate, endDate } = req.body;

    startDate = new Date(startDate);
    startDate.setHours(0, 0, 0, 0);

    // Set time to the end of the day for endDate
    endDate = new Date(endDate);
    endDate.setHours(23, 59, 59, 999);


    let salesData = await orderModel
      .find({
        orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      })
      .populate("userId");

    req.session.adminuser = {};
    req.session.adminuser.dateValues = req.body;
    req.session.adminuser.salesData = JSON.parse(JSON.stringify(salesData));
    // console.log(typeof(req.session.admin.salesData));

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
  }
};

// ---------------------------offer pages---------------------------------

const getOfferPage = async (req, res) => {
  try {
    const offers = await offerModel.find().populate("product");
    console.log(offers);
    const products = await productModel.find();
    await applyProductOffer();
    res.render("offers", { offers, products });
  } catch (error) {
    console.log(error);
  }
};

const getAddOffer = async (req, res) => {
  try {
    const offers = await offerModel.find().populate("product");
    const products = await productModel.find();
    res.render("addOffer", {
      admin: req.session.admin,
      products,
      offers,
    });
  } catch (error) {
    res.redirect("/500");
  }
};

const addProductOfferController = async (req, res) => {
  try {
    const { product, offerPercentage, startDate, endDate } = req.body;

    const offerExist = await offerModel.findOne({ product });

    if (offerExist) {
      return res.status(500).send({ exist: true });
    }

    const offer = await new offerModel({
      product,
      offerPercentage,
      startDate,
      endDate,
    }).save();
    console.log(offer);

    return res.status(200).send({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false });
  }
};

const getEditOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await offerModel.findOne({ _id: id });
    res.render("editOffer", {
      admin: req.session.admin,
      offer: offer,
    });
  } catch (error) {
    res.redirect("/500");
  }
};

const editProductOffer = async (req, res) => {
  try {
    const { id, offerPercentage, startDate, endDate } = req.body;

    const offer = await offerModel.findByIdAndUpdate(id, {
      offerPercentage,
      startDate,
      endDate,
    });
    console.log(offer);
    res.send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false });
  }
};

const editProductOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await offerModel.findOne({ _id: id });
    if (offer.isAvailable) {
      await offerModel.findByIdAndUpdate(id, {
        isAvailable: false,
      });
    } else {
      await offerModel.findByIdAndUpdate(id, {
        isAvailable: true,
      });
    }
    res.redirect("/offers");
  } catch (error) {
    console.log(error);
  }
};

// -----------------------category offers-----------------------

const getcategoryoffer = async (req, res) => {
  try {
    const categories = await categoryModel.find();
    const offers = await categoryOfferModel.find().populate("category");
    applyCategoryOffer();
    res.render("categoryOffer", { categories, offers });
  } catch (error) {
    console.log(error);
  }
};

const getAddcategoryOffer = async (req, res) => {
  try {
    const offers = await categoryOfferModel.find().populate("category");
    const categories = await categoryModel.find();
    res.render("addCategoryOffer", {
      admin: req.session.admin,
      categories,
      offers,
    });
  } catch (error) {
    console.log(error);
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    const { category, offerPercentage, startDate, endDate } = req.body;

    const offerExist = await categoryOfferModel.findOne({ category });

    if (offerExist) {
      return res.status(500).send({ exist: true });
    }

    const offer = await new categoryOfferModel({
      category,
      offerPercentage,
      startDate,
      endDate,
    }).save();

    return res.status(200).send({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false });
  }
};

const editCategoryOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await categoryOfferModel.findOne({ _id: id });
    if (offer.isAvailable) {
      await categoryOfferModel.findByIdAndUpdate(id, {
        isAvailable: false,
      });
    } else {
      await categoryOfferModel.findByIdAndUpdate(id, {
        isAvailable: true,
      });
    }
    res.redirect("/categoryoffers");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  adminHome,
  adminLogin,
  postadminLogin,
  productMngt,
  userMngt,
  categoryMngt,
  orderMngt,
  getuserBlock,
  getuserUnblock,
  getaddproduct,
  add_product,
  addProductController,
  listProduct,
  unlistproduct,
  editProduct,
  // update_product,
  editProductController,
  getaddcategory,
  postAddCategory,
  listcategory,
  unlistcategory,
  posteditCategory,
  geteditcategory,
  order_details,
  status_update,
  adminLogout,
  changeStatusPending,
  changeStatusShipped,
  changeStatusDelivered,
  changeStatusReturn,
  changeStatusCancelled,
  couponMngt,
  getaddCoupon,
  postAddCoupon,
  editCoupon,
  posteditCoupon,
  listCoupon,
  unlistCoupon,
  dashboardData,
  salesReport,
  getOfferPage,
  getAddOffer,
  addProductOfferController,
  getEditOffer,
  editProductOffer,
  editProductOfferStatus,
  getcategoryoffer,
  getAddcategoryOffer,
  addCategoryOffer,
  editCategoryOfferStatus,
  salesReportFilter,
};

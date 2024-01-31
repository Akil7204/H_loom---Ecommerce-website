const UserCollection = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sendOtp = require("../actions/otp");
const idcreate = require("../actions/idcreate");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const orderModel = require("../model/orderModel");
const Wallet = require("../model/walletModel");
const couponModel = require("../model/couponModel");
const cartCollection = require("../model/cartModel");
const createInvoice = require("../helpers/generatepdf");
const {
  applyProductOffer,
  applyCategoryOffer,
} = require("../helpers/applyProductOffers");
const applyReferralOffer = require("../helpers/applyReferralOffer.js");
// Razorpay
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const Razorpay = require("razorpay");

let instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

// ------------------USER LOGIN--------------

const userLogin = async (req, res) => {
  await applyCategoryOffer();
  await applyProductOffer();
  res.render("home", { user: req.session.user });
};

const login = (req, res) => {
  if (req.session.user && req.session.user.status === "Unblock") {
    res.redirect("/");
  } else {
    res.render("userlogin");
  }
};

const getSignupPage = (req, res) => {
  const referral = req.query.referral
  if (req.session.user) {
    res.redirect("/");
  } else {

    res.render("usersignUp",{referral});
  }
};

const postSignupPage = async (req, res) => {
  const { email, name, mobile, password, confirmpassword } = req.body;
  const user = await UserCollection.findOne({ email });
  console.log(user);

  if (user) {
    return res.render("userSignUp", { duplicate: "user already found" });
  }
  if (
    name == "" ||
    email == "" ||
    password == "" ||
    mobile == "" ||
    confirmpassword == ""
  ) {
    const fieldRequired = " All Fields Are Required";
    res.render("userSignUp", { fieldRequired });
  } else {
    if (password != confirmpassword) {
      res.render("userSignUp", { passworder: "passwords are not same" });
    } else {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      console.log(hashedPassword);

      let referralCode = Math.floor(1000 + Math.random() * 9000);
      req.session.referralCode = referralCode;

      randomOtp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
      req.session.otp = randomOtp;
      console.log(randomOtp);

      req.session.tempUserReferralCode = req.body?.referralCode;

      sendOtp(req.body.email, randomOtp)
        .then(() => {
          req.session.signup = req.body;
          req.session.signup.password = hashedPassword;
          return res.render("otp", { user: req.session.signup });
        })
        .catch((err) => {
          return res.render("userSignUp", {
            error: true,
            message: "email sent failed",
          });
        });
    }
  }
};

const postVerifyOtp = async (req, res) => {
  const { name, email, password, mobile } = req.session.signup;
  console.log(req.session.signup);

  // const Email=req.body.email
  // console.log(Email+ "OTPEMAIL")

  if (req.body.otp == req.session.otp) {
    console.log("otp verified");
    referralCode = req.session.referralCode;
    const user = new UserCollection({
      name,
      email,
      mobile,
      password,
      referralCode,
    });
    console.log(user);

    user.save();
    //adding money to the reffered user's wallet if referral code exists
    let tempUserReferralCode = req.session?.tempUserReferralCode;
    if (tempUserReferralCode) {
      await applyReferralOffer(tempUserReferralCode);
    }

    req.session.otp = false;

    res.render("userlogin", {
      regerstrationMessage: "Account successfully created! Please login.",
    });
  } else {
    res.render("otp", { error: true, wrong: "Invalid OTP", ...req.body });
  }
};

const resendotp = async (req, res, next) => {
  try {
    const { email } = req.session.signup;
    // console.log(req.body+ "email for resend")

    // generate a new OTP and store it in the session
    const randomOtp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    console.log(randomOtp + "  4");
    req.session.otp = randomOtp;

    // send the new OTP to the user's email address
    sendOtp(email, randomOtp)
      .then(() => {
        return res.render("otp", {
          user: req.session.signup,
          sucess: "OTP resend sucessfuly check your Email !!",
        });
      })
      .catch((err) => {
        // handle the error appropriately
        console.error(err);
        return res.render("userSignUp", {
          error: true,
          message: "email sent failed",
        });
      });
  } catch (err) {
    next(err);
  }
};

const userVerfication = async (req, res) => {
  const email = req.body.email;

  let userExists = await UserCollection.findOne({ email: email });

  if (userExists) {
    const password = bcrypt.compareSync(req.body.password, userExists.password);
    console.log(password);
    console.log(req.body.password);

    if (password && userExists.status == "Unblock") {
      req.session.user = userExists;
      console.log("session started");
      res.redirect("/");
    } else if (userExists.status == "block") {
      res.render("userlogin", { wrong: "You are blocked " });
    } else {
      res.render("userlogin", { wrong: "Invalid email or password " });
    }
  } else {
    res.render("userlogin", { wrong: "user not found" });
  }
};

const forgotPage = async (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    res.render("error", error.messsage);
  }
};

const forgetPassword = async (req, res) => {
  try {
    const userData = await UserCollection.findOne({ email: req.body.email });
    if (userData) {
      if (userData.status == "Unblock") {
        const OTP = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        console.log(OTP + "  4");
        req.session.OTP = OTP;

        sendOtp(userData.email, OTP)
          .then(() => {
            req.session.userData = userData;
            console.log("hi");
            return res.render("forgotPasswordOTP", {
              message: "1",
              status: "OTP Send",
              user: userData,
            });
          })
          .catch((err) => {
            // handle the error appropriately
            console.error(err);
            return res.render("forgotPassword", {
              error: true,
              wrong: "email sent failed",
            });
          });
      } else {
        res.render("forgotPassword", {
          message: "0",
          wrong: "Account Blocked",
        });
      }
    } else {
      res.render("forgotPassword", { message: "0", wrong: "Incorrect Email" });
    }
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

const forgotpassword = async (req, res) => {
  try {
    res.render("forgotPasswordOTP");
  } catch (error) {
    res.render("error", error.messsage);
  }
};

const verifyOTPFP = async (req, res) => {
  // const Email=req.body.email
  // console.log(Email+ "OTPEMAIL")

  if (req.body.otp == req.session.OTP) {
    console.log("otp verified");
    req.session.otp = false;

    res.render("resetPassword", {
      regerstrationMessage: "Enter your new password.",
    });
  } else {
    res.render("otp", { error: true, wrong: "Invalid OTP", ...req.body });
  }
};

const resetPW = (req, res) => {
  try {
    res.render("resetPassword", { email: req.body.email });
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await UserCollection.updateOne(
      { email: req.session.userData.email },
      { $set: { password: hashedPassword } }
    );
    res.render("userlogin", {
      regerstrationMessage: "Password successfully changed! Please login.",
    });
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

// ---------------------------------product page----------------------------

const productspage = async (req, res) => {
  try {
    let allProducts;
    let count;
    let page = Number(req.query.page) || 1;
    // let limit = Number(req.query.limit);
    let limit = 9;
    let skip = (page - 1) * limit;

    const category = await categoryModel.find({ status: "available" });

    if (req.session.shopProductData) {
      allProducts = req.session.shopProductData;
    } else {
      count = await productModel
        .find({
          status: "available",
        })
        .estimatedDocumentCount();
      allProducts = await productModel
        .find({
          status: "available",
        })
        .skip(skip)
        .limit(limit);
    }
    console.log(allProducts);

    // let products = allProducts.filter((product) => {
    //   if (category.status === 'available' && product.status === 'available' ) {
    //     return product;
    //   }
    // });
    // console.log(products);

    await applyCategoryOffer();
    await applyProductOffer();

    res.render("product", {
      userdetail: req.session.user,
      category: category,
      products: allProducts,
      count,
      limit,
      user: req.session.user_id,
    });
    req.session.shopProductData = null;
    req.session.save();
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

const filterCategory = async (req, res) => {
  try {

    req.session.shopProductData = await productModel.find({
      status: "available",
      category: req.params.categoryName,
    });
    res.redirect("/product");
  } catch (error) {
    console.error(error);
  }
};

const filterPriceRange = async (req, res) => {
  try {
    req.session.shopProductData = await productModel.find({
      status: "available",
      price: {
        $gt: 0 + 500 * req.query.priceRange,
        $lte: 500 + 500 * req.query.priceRange,
      },
    });
    res.redirect("/product");
  } catch (error) {
    console.error(error);
  }
};

const sortPriceAscending = async (req, res) => {
  try {
    req.session.shopProductData = await productModel
      .find({ status: "available" })
      .sort({ price: 1 });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
  }
};

const sortPriceDescending = async (req, res) => {
  try {
    req.session.shopProductData = await productModel
      .find({ status: "available" })
      .sort({ price: -1 });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
  }
};

const getproductDetails = async (req, res) => {
  try {
    const _id = req.params.id;
    console.log(req.params.id);

    const product = await productModel.findById({ _id }).lean();
    const id = req.session.user;
    const user = await UserCollection.findOne({ _id: id }).lean();
    // Render the page with the product details
    res.render("productView", { product, user });
  } catch (err) {
    console.error(err);
    // Handle the error appropriately, e.g., render an error page
    res.render("error", {
      error: "An error occurred while fetching product details",
    });
  }
};

// -----------------whishlist---------------------------------------------------------------------------------------------------------------

const wishlist = async (req, res) => {
  try {
    if (req.session.user) {
      const id = req.session.user._id;

      const user = await UserCollection.findById({ _id: id }).lean();

      const wishlist = user.wishlist;

      const product = await productModel
        .find({ _id: { $in: wishlist } })
        .lean();

      res.render("wishlist", { product, user });
    } else {
      res.render("userlogin");
    }
  } catch (err) {
    console.log(err);
  }
};

const addtowishList = async (req, res) => {
  try {
    const _id = req.session.user.id;

    const proId = req.params.id;
    await UserCollection.updateOne(
      { _id },
      {
        $addToSet: {
          wishlist: proId,
        },
      }
    );
    res.redirect("back");
  } catch (err) {
    res.render("404");
    console.log(err);
  }
};

const removeWishlist = async (req, res) => {
  try {
    const _id = req.session.user.id;
    const id = req.params.id;

    await userModel.updateOne(
      { _id },
      {
        $pull: {
          wishlist: id,
        },
      }
    );

    res.redirect("back");
  } catch (err) {
    res.render("404");
    console.log(err);
  }
};

// --------------------cart------------------------

//updating totalCostPerProduct and grand total in cart-page
async function grandTotal(req) {
  try {
    let userCartData = await cartCollection
      .find({ userId: req.session.user._id })
      .populate("productId");

    // if (!req.session.grandTotal) {

    let grandTotal = 0;
    for (const v of userCartData) {
      grandTotal += v.productId.offerPrice * v.productQuantity;
      await cartCollection.updateOne(
        { _id: v._id },
        {
          $set: {
            totalCostPerProduct: v.productId.offerPrice * v.productQuantity,
          },
        }
      );
    }
    userCartData = await cartCollection
      .find({ userId: req.session.user._id })
      .populate("productId");
    req.session.grandTotal = grandTotal;
    // }

    return JSON.parse(JSON.stringify(userCartData));
  } catch (error) {
    console.log(error);
  }
}

const getCartPage = async (req, res) => {
  try {
    let userCartData = await grandTotal(req);
    console.log(userCartData);
    const coupons = await couponModel.find({});
    console.log(coupons);

    let empty;
    userCartData == 0 ? (empty = true) : (empty = false);
    res.render("cart", {
      user: req.session.user,
      cart: userCartData,
      grandTotal: req.session.grandTotal,
      empty,
      coupons: coupons,
    });
  } catch (error) {
    console.error(error);
  }
};

const addtoCart = async (req, res) => {
  try {
    let existingProduct = null;
    existingProduct = await cartCollection.findOne({
      userId: req.session.user._id,
      productId: req.params.id,
    });
    if (existingProduct) {
      await cartCollection.updateOne(
        { _id: existingProduct._id },
        { $inc: { productQuantity: 1 } }
      );
    } else {
      await cartCollection.insertMany([
        {
          userId: req.session.user._id,
          productId: req.params.id,
          productQuantity: req.body.productQuantity,
        },
      ]);
      console.log(req.body);
    }
    res.redirect("back");
  } catch (error) {
    console.log(error);
  }
};

const incQty = async (req, res) => {
  try {
    let cartProduct = await cartCollection
      .findOne({ _id: req.params.id })
      .populate("productId");
    if (cartProduct.productQuantity < cartProduct.productId.quantity) {
      cartProduct.productQuantity++;
    }
    cartProduct = await cartProduct.save();
    await grandTotal(req);
    res.json({ cartProduct, grandTotal: req.session.grandTotal });
  } catch (error) {
    console.error(error);
  }
};

const decQty = async (req, res) => {
  try {
    let cartProduct = await cartCollection
      .findOne({ _id: req.params.id })
      .populate("productId");
    console.log(cartProduct);
    if (cartProduct.productQuantity > 1) {
      cartProduct.productQuantity--;
    }
    cartProduct = await cartProduct.save();
    await grandTotal(req);
    res.json({ cartProduct, grandTotal: req.session.grandTotal });
  } catch (error) {
    console.error(error);
  }
};

//cart page - delete cart page
const deleteFromCart = async (req, res) => {
  try {
    await cartCollection.findOneAndDelete({ _id: req.params.id });
    res.send("hello ur cart is deleted");
  } catch (error) {
    console.error(error);
  }
};

const checkvalid_Coupon = async (req, res) => {
  try {
    let couponCode = req.body.code;
    console.log(couponCode);
    let user = req.session.user;
    let orderAmount = req.body.amount;
    console.log(orderAmount);
    const coupon = await couponModel.findOne({ couponCode: couponCode });
    const order = await orderModel.findOne({ _id: user });
    if (coupon) {
      if (!coupon.usedUsers.includes(user)) {
        console.log("notuser");
        if (orderAmount >= coupon.minimumAmount) {
          // order
          console.log("success");
          res.send({ msg: "1", discount: coupon.couponAmount });
        } else {
          res.send({
            msg: "2",
            message: "Coupon is not applicable for this price",
          });
        }
      } else {
        res.send({ msg: "2", message: "Coupon already used" });
      }
    } else {
      res.send({ msg: "2", message: "Coupon Code Invalid" });
    }
    // console.log("kkkkkkk")
    // const couponCode = req.query.id;
    // const coupon = await couponModel.findOne({ couponName: couponCode });
    // if (coupon) {
    //   res.json({ message: "", coupon: coupon });
    // } else {

    //   res.send({ message: "Coupon code invalid" });
    // }
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

// ------------------------------------------profile page--------------------------------------

const getuserProfile = async (req, res) => {
  try {
    const id = req.session.user;
    console.log(id);
    const user = await UserCollection.findOne({ _id: id }).lean();

    let wallet = await Wallet.findOne({ user: id });

    if (!wallet) {
      wallet = await Wallet.create({ user: id });
    }
    const balance = wallet.balance;
    req.session.productid = false;

    res.render("Profile", { user, balance });
  } catch (err) {
    console.log(err);
  }
};

const getuserdashboard = async (req, res) => {
  try {
    const id = req.session.user;
    console.log(id);
    const user = await UserCollection.findOne({ _id: id }).lean();
    console.log(user);

    res.render("dashboard", { user });
  } catch (err) {
    console.log(err);
  }
};
const getuseraddress = async (req, res) => {
  try {
    const id = req.session.user;

    const user = await UserCollection.findOne({ _id: id }).lean();
    console.log(user);

    res.render("address", { user });
  } catch (err) {
    console.log(err);
  }
};

const getAddress = async (req, res) => {
  const id = req.session.user;

  const user = await UserCollection.findOne({ _id: id }).lean();
  res.render("AddAddress", { user });
};
const postAddress = async (req, res) => {
  try {
    const _id = req.session.user;

    const user = await UserCollection.updateOne(
      { _id },
      {
        $addToSet: {
          address: {
            ...req.body,
            id: idcreate(),
          },
        },
      }
    );
    console.log(req.url + "checking");

    if (req.session.productid == true) {
      req.session.productid = false;
      res.redirect("/product-checkout");
    } else {
      res.redirect("/profile");
    }
  } catch (err) {
    console.log(err);
  }
};

const getEditAddress = async (req, res) => {
  const _id = req.params.id;
  try {
    let { address } = await UserCollection.findOne(
      { "address._id": _id },
      { _id: 0, address: { $elemMatch: { _id } } }
    );
    res.render("editAddress", { address: address[0] });
  } catch (err) {
    console.log(err);
  }
};

const posteditAddress = async (req, res) => {
  try {
    const _id = req.session.user;
    const addressIdToUpdate = req.body.id;

    const user = await UserCollection.updateOne(
      { _id, "address._id": addressIdToUpdate },
      {
        $set: {
          "address.$": {
            ...req.body,
            id: addressIdToUpdate,
          },
        },
      }
    );
    console.log(user.address + "  3");
    res.redirect("/address");
  } catch (err) {
    console.log(err);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const id = req.params.id;

    await UserCollection.updateOne(
      { _id: req.session.user._id },
      { $pull: { address: { _id: id } } }
    );

    res.redirect("/address");
  } catch (err) {
    console.log(err);
  }
};

// --------------------check out------------------------------

const getcheckout = async (req, res) => {
  try {
    // console.log("checkoooooooooooout");

    const id = req.session.user._id;
    const user = await UserCollection.findById({ _id: id }).lean();
    // for (const i of user.cart) {
    //   let product = await productModel.findOne({ _id: i.id });
    //   totalPrice = totalPrice + product.price * i.quantity;
    // }

    res.render("checkout", { user, totalPrice: req.session.grandTotal });
  } catch (err) {
    console.log(err);
  }
};

const getpayment = async (req, res) => {
  try {
    const id = req.params.id;
    const user_id = req.session.user._id;
    let address = await UserCollection.findOne(
      { _id: user_id, "address._id": id },
      { _id: 0, "address.$": 1 }
    );

    req.session.address = address;

    const user = await UserCollection.findById({ _id: user_id }).lean();

    totalPrice = req.session.grandTotal;
    res.render("payment-checkout", {
      user,
      totalPrice,
      address: address.address[0],
    });
  } catch (err) {
    console.log(err);
  }
};

const getreview = async (req, res) => {
  try {
    const id = req.session.user._id;
    const cart = await cartCollection
      .find({ userId: id })
      .populate("productId");

    let wallet = await Wallet.findOne({ user: id });
    const balance = wallet.balance;
    if (req.body.checkbox == "cod") {
      req.session.payment = "cod";
    } else if (req.body.checkbox == "Razopay") {
      req.session.payment = "Razopay";
    } else {
      req.session.payment = "wallet";
    }
    console.log(req.session.payment);
    console.log(cart);
    totalPrice = req.session.grandTotal;
    address = req.session.address;
    user = req.session.user;
    res.render("checkout-4", {
      user,
      cart,
      totalPrice,
      balance,
      address: address.address[0],
      payment: req.session.payment,
    });
  } catch (err) {
    console.log(err);
  }
};

const GenerateOrder = async (req, res) => {
  try {
    const amount = req.session.grandTotal;
    //RaZor Pay
    instance.orders
      .create({
        amount: amount + "00",
        currency: "INR",
        receipt: "receipt#1",
      })
      .then((order) => {
        return res.send({ orderId: order.id });
      });
  } catch (error) {
    console.log(error);
  }
};

const postCheckout = async (req, res) => {
  try {
    const id = req.session.user;
    let paiduser = false;
    
    if (req.body.razorpay_payment_id) {
      console.log(id);
      paiduser = true;
      const paymentofoder = req.body.razorpay_payment_id;
      req.session.razorpay_id = paymentofoder;
    }
    // paymentId: req.body.razorpay_payment_id

    if (req.session.payment == "wallet") {
      total = req.session.grandTotal;
      const wallet = await Wallet.findOne({ user: id });

      if (wallet.length <= 0) {
        const succes = Wallet.create({ user: id }, { new: true });
      } else if (wallet.balance - total < 0) {
        return res.send("Not enough balance");
      } else {
        wallet.balance = wallet.balance - total;
        wallet.walletHistory.push({
          date: Date.now(),
          amount: -total,
          message: "Used for purchase",
        });
        paiduser = true;
        wallet.save();
      }
    }

    const address = req.session.address.address;

    await orderModel.create({
      userId: req.session.user._id,
      orderNumber: (await orderModel.countDocuments()) + 1,
      orderDate: new Date(),
      address: address, //default address
      cartData: await grandTotal(req),
      grandTotalCost: req.session.grandTotal,
      paymentType: req.session.payment,
      paid: paiduser,
    });

    await cartCollection.deleteMany({ userId: req.session.user._id });

    console.log("hooooooooooooo");
    if (req.session.payment == "cod") {
      res.send({ message: "1" });
    } else {
      res.redirect("/checkout-5");
    }
  } catch (error) {
    console.log(error);
  }
};

const getoderplaced = async (req, res) => {
  res.render("checkout-5");
};

// -------------------------- oder--------------------------------

const getOrders = async (req, res) => {
  try {
    let count;
    let page = Number(req.query.page) || 1;
    let limit = 8;
    let skip = (page - 1) * limit;

    const users = req.session.user;

    count = await orderModel
      .find({ userId: users._id })
      .estimatedDocumentCount();

    const user = await UserCollection.findOne(users);

    const order = await orderModel
      .find({ userId: users._id })
      .skip(skip)
      .limit(limit);

    let empty;
    order.length == 0 ? (empty = true) : (empty = false);

    res.render("orders", {
      order,
      count,
      limit,
      empty,
      user,
    });
  } catch (err) {
    console.log(err);
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderid = req.params.id;
    console.log("order id is..." + orderid);
    const order_details = await orderModel.findById({ _id: orderid });

    res.render("single-order", {
      order: order_details,
      user: req.session.user,
    });
    console.log(order_details);
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

const cancel_order = async (req, res) => {
  try {
    const orderId = req.body.id;
    const userId = req.session.user;

    let order = await orderModel.findById(orderId);
    console.log(order);
    if (!order.cancel) {

      if (order.paymentType != "cod") {
        console.log("ok");
        const wallet = await Wallet.findOne({ user: userId });
        console.log(wallet);
        wallet.balance +=  order.grandTotalCost;
        console.log(wallet.balance);
        wallet.walletHistory.push({
          date: Date.now(),
          amount:  order.grandTotalCost,
          message: "Deposited while canecelled order"
        });
        wallet.save();
      }

      order = await orderModel.findByIdAndUpdate(
        orderId,
        { orderStatus: "Cancelled", paid: false, cancel: true },
        { new: true }
      );

      if (order) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } else {
      res.send({ message: "0" });
    }
  } catch (error) {
    res.render("error", { error: error.message });
    // console.log('error',{error:error.message})
  }
};

const returnRequest = async (req, res) => {
  try {
    const orderid = req.body.id;
    console.log(orderid);
    order = await orderModel.findByIdAndUpdate(
      { _id: orderid },
      { $set: { orderStatus: "Return" } },
      { new: true }
    );
    if (order) {
      res.send({ message: "1" });
    } else {
      res.send({ message: "0" });
    }
  } catch (error) {
    res.render("error", { error: error.message });
  }
};

// -----------------------------------apply promo code-----------------------------------------

const applyPromo = async (req, res) => {
  try {
    let code = req.body.code;
    let total = req.body.total;
    const coupon = await couponModel.findOne({ code: code });
    if (coupon) {
      if (total > coupon.minAmount) {
        return res.send({
          error: `Minimum purchase value is ${coupon.minAmount}`,
        });
      }
      return res.send({ value: coupon.cashback, id: coupon._id });
    } else {
      return res.send({ error: "Invalid Code" });
    }
  } catch (error) {
    console.log(error);
  }
};

const applyCoupon = async (req, res) => {
  try {
    let { couponCode } = req.body;

    //Retrive the coupon document from the database if it exists
    let couponData = await couponModel.findOne({ couponCode });

    if (couponData && couponData.usedUsers != req.session.user._id) {
      /*if coupon exists:
      > check if it is applicable, i.e within minimum purchase limit & expiry date
      >proceed... */

      let { grandTotal } = req.session;
      let { minimumAmount, expiryDate } = couponData;
      let minimumPurchaseCheck = minimumAmount < grandTotal;
      let expiryDateCheck = new Date() < new Date(expiryDate);

      if (minimumPurchaseCheck && expiryDateCheck) {
        /* if coupon exists check if it is applicable :
        >calculate the discount amount
        >update the database's order document
        >update the grand total in the req.session for the payment page
        */
        let { couponAmount } = couponData;
        let discountAmount = couponAmount;

        let { user } = req.session;
        await couponModel.findByIdAndUpdate(
          { _id: couponData._id },
          {
            $set: { usedUsers: user._id },
          }
        );
        console.log(req.session.grandTotal);
        req.session.grandTotal -= discountAmount;
        console.log(req.session.grandTotal);

        // Respond with a success status and indication that the coupon was applied
        res.status(202).json({ couponApplied: true, discountAmount });
      } else {
        // Respond with an error status if the coupon is not applicable
        res.status(501).json({ couponApplied: false });
      }
    } else {
      // Respond with an error status if the coupon does not exist
      res.status(501).json({ couponApplied: false });
    }
  } catch (error) {
    console.error(error);
  }
};

const invoiceDownloadController = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderModel.findOne({ _id: id });

    const stream = res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment;filename=invoice.pdf",
    });

    createInvoice(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      order
    );
  } catch (error) {
    console.log(error);
  }
};

// -----------------------wallet---------------------------

const getWalletHistory = async (req, res) => {
  try {
    const id = req.session.user._id;

    const userDetails = await Wallet.findOne({ user: id });

    res.render("wallet", {
      user: req.session.user,
      wallet: userDetails,
    });
  } catch (error) {
    res.redirect("/500");
  }
};

// --------------LOgout---------------------

const logout = (req, res) => {
  req.session.user = false;
  console.log("session ends");
  res.redirect("/login");
};

module.exports = {
  userLogin,
  login,
  getSignupPage,
  postSignupPage,
  postVerifyOtp,
  resendotp,
  userVerfication,
  productspage,
  getproductDetails,
  wishlist,
  addtowishList,
  removeWishlist,
  getCartPage,
  addtoCart,
  incQty,
  decQty,
  deleteFromCart,
  getuserProfile,
  getuserdashboard,
  getuseraddress,
  getAddress,
  postAddress,
  getEditAddress,
  posteditAddress,
  deleteAddress,
  getcheckout,
  getpayment,
  forgotPage,
  forgetPassword,
  forgotpassword,
  verifyOTPFP,
  resetPW,
  resetPassword,
  getreview,
  getOrders,
  postCheckout,
  orderDetails,
  logout,
  cancel_order,
  returnRequest,
  filterCategory,
  filterPriceRange,
  sortPriceAscending,
  sortPriceDescending,
  GenerateOrder,
  applyPromo,
  checkvalid_Coupon,
  getoderplaced,
  applyCoupon,
  invoiceDownloadController,
  getWalletHistory,
};

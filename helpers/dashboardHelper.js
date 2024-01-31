const categoryCollection = require("../model/categoryModel.js");
const orderCollection = require("../model/orderModel.js");
const productCollection = require("../model/productModel.js");
const userCollection = require('../model/userModel.js');

module.exports = {
  productsCount: async () => {
    try {
      return await productCollection.countDocuments();
    } catch (error) {
      console.error(error);
    }
  },

  categoryCount: async () => {
    try {
      return await categoryCollection.countDocuments();
    } catch (error) {
      console.error(error);
    }
  },

  pendingOrdersCount: async () => {
    try {
      return await orderCollection.countDocuments({
        orderStatus: { $ne: "Delivered" },
      });
    } catch (error) {
      console.error(error);
    }
  },

  completedOrdersCount: async () => {
    try {
      return await orderCollection.countDocuments({ orderStatus: "Delivered" });
    } catch (error) {
      console.error(error);
    }
  },

  currentDayRevenue: async () => {
    try {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const result = await orderCollection.aggregate([
        { $match: { orderDate: { $gte: yesterday, $lt: today } } },
        { $group: { _id: "", totalRevenue: { $sum: "$grandTotalCost" } } },
      ]);
      return result.length>0?result[0].totalRevenue: 0;
    } catch (error) {
      console.error(error);
    }
  },

  fourteenDaysRevenue: async () => {
    try {
      const result = await orderCollection.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            dailyRevenue: { $sum: "$grandTotalCost" },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $limit: 14,
        },
      ]);
      return {
        date: result.map((v) => v._id),
        revenue: result.map((v) => v.dailyRevenue),
      };
    } catch (error) {
      console.error(error);
    }
  },

  categoryWiseRevenue: async () => {
    try {
      const result = await orderCollection.aggregate([
        { $unwind: "$cartData" },
        {
          $group: {
            _id: "$cartData.productId.category",
            revenuePerCategory: { $sum: "$cartData.totalCostPerProduct" },
          },
        },
      ]);

      return {
        categoryName: result.map((v) => v._id),
        revenuePerCategory: result.map((v) => v.revenuePerCategory),
      };
    } catch (error) {
      console.error(error);
    }
  },

  Revenue: async () => {
    try {
      const result = await orderCollection.find();

      return {
        revenue: result.reduce((acc, curr) => (acc += curr.grandTotalCost), 0)
      };
    } catch (error) {
      console.error(error);
    }
  },

  MonthlyRevenue: async () => {
    try {
      const today = new Date();
      const lastmonth = new Date();
      lastmonth.setDate(today.getDate() - 28);

      const result = await orderCollection.aggregate([
        { $match: { orderDate: { $gte: lastmonth, $lt: today } } },
        { $group: { _id: "", MonthlyRevenue: { $sum: "$grandTotalCost" } } },
      ]);
      return result.length>0?result[0].MonthlyRevenue: 0;
    } catch (error) {
      console.error(error);
    }
  },
  Activeuser: async () => {
    try {
      return  await userCollection.find({ status: "Unblock" }).count()
    } catch (error) {
      console.error(error);
    }
  }

  // const order = await OrderModel.find();
  //   const orderCount = order.length;
  //   const revenue = order.reduce((acc, curr) => (acc += curr.totalPrice), 0);
};
const userCollection = require("../model/userModel");
const wallet = require("../model/walletModel");

module.exports = async (referralCode) => {
  try {
    let referralCodeExists = await userCollection.findOne({ referralCode });

    if (referralCodeExists) {
      await wallet.updateOne(
        { user: referralCodeExists._id },
        {
          $inc: {
            balance: 500,
          },
          $push: {
            walletHistory: {
              date: Date.now(),
              amount: 500,
              message: "BY referral code",
            },
          },
        }
      );
      console.log("Referral Applied");
    }
  } catch (error) {
    console.error(error);
  }
};

const ProductModel = require("../model/productModel");
const ProductOfferModel = require("../model/productOfferModel");
const CategoryOfferModel = require("../model/categoryOfferModel");

const applyProductOffer = async () => {
  try {
    const today = new Date();

    const offers = await ProductOfferModel.find().populate("product");
    

    offers.forEach(async (offer) => {
      if (offer.product.offerPrice === offer.product.price) {
        if (
          offer.startDate <= today &&
          offer.endDate >= today &&
          offer.isAvailable
        ) {
          await ProductModel.findByIdAndUpdate(offer.product, {
            offerPrice: Math.floor(
              offer.product.price -
                (offer.product.price * offer.offerPercentage) / 100
            ),
          });
        } else {
          await ProductModel.findByIdAndUpdate(offer.product, {
            offerPrice: offer.product.price,
          });
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const applyCategoryOffer = async () => {
  try {
    const today = new Date();

    const offers = await CategoryOfferModel.find({ isAvailable: true }).populate("category");

   
    const allProducts = await ProductModel.find();

    for (const prod of allProducts) {
      const currentOffer = offers.find(
        (offer) => String(offer.category.category) == String(prod.category)
      );
      

      if (
        currentOffer &&
        currentOffer.startDate <= today &&
        currentOffer.endDate >= today
      ) {
        await ProductModel.findByIdAndUpdate(prod._id, {
          offerPrice: Math.floor(
            prod.price - (prod.price * currentOffer.offerPercentage) / 100
          ),
        });
      } else {
        await ProductModel.findByIdAndUpdate(prod._id, {
          offerPrice: prod.price,
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { applyProductOffer, applyCategoryOffer };

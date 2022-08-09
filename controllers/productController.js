/* eslint-disable no-unused-vars */
const cloudinary = require('cloudinary');
const CustomError = require('../util/customError');
const Product = require('../models/products');
const BigPromise = require('../middlewares/bigPromise');
const WhereClause = require('../util/whereClause');

exports.addProduct = BigPromise(async (req, res, next) => {
  const imageArray = [];

  if (!req.files) {
    return next(new CustomError('images are required', 401));
  }

  if (req.files) {
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < req.files.photos.length; index++) {
      // eslint-disable-next-line no-await-in-loop
      const result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: 'products',
        }
      );

      imageArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }

  req.body.photos = imageArray;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProducts = BigPromise(async (req, res, _next) => {
  const resultperPage = 6;
  //totalCount is used to get the total count of the data
  const totalCountProduct = await Product.countDocuments();

  //whereClause is a function that takes in a query object and returns a where clause
  const productsObject = new WhereClause(Product.find(), req.query)
    .search()
    .filter();
  //products is used to get the data
  let products = await productsObject.base;
  //filterProductsNumber is used to get the number of products
  const filterProductNumber = await products.length;

  productsObject.pager(resultperPage);
  //products is used to get the data cloned to products
  products = await productsObject.base.clone();

  res.status(200).json({
    message: 'Products fetched successfully',
    products,
    filterProductNumber,
    totalCountProduct,
  });
});

exports.getOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }
  res.status(200).json({
    message: 'Product fetched successfully',
    product,
  });
});

//admin only controller
exports.adminGetAllProduct = BigPromise(async (_req, res, next) => {
  const product = await Product.find();
  console.log(product);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }

  res.status(200).json({
    message: 'Products fetched successfully',
    product,
  });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }

  const imageArrays = [];
  if (req.files) {
    //destroy the old images
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < req.files.photos.length; index++) {
      // eslint-disable-next-line no-await-in-loop
      await cloudinary.v2.uploader.destroy(product.photos[index].id);
    }

    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < req.files.photos.length; index++) {
      // eslint-disable-next-line no-await-in-loop
      const result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: 'products',
        }
      );
      imageArrays.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
      req.body.photos = imageArrays;
    }
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    message: 'Product updated successfully',
    product,
  });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }
  //destroy the old images
  // eslint-disable-next-line no-plusplus
  for (let index = 0; index < product.photos.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await cloudinary.v2.uploader.destroy(product.photos[index].id);
  }
  await product.remove();
  res.status(200).json({
    message: 'Product deleted successfully',
  });
});

exports.addReview = BigPromise(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  //retrieve the product
  const review = {
    // eslint-disable-next-line no-underscore-dangle
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment: comment,
  };
  const product = await Product.findById(productId);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }
  //Allow only one review per user
  const AlreadyReviewed = product.reviews.find(
    // eslint-disable-next-line no-underscore-dangle
    //to check if the user has already reviewed the product or not if yes then it will return true
    // eslint-disable-next-line no-underscore-dangle
    (re) => re.user.toString() === req.user._id.toString()
  );
  if (AlreadyReviewed) {
    product.reviews.forEach((re) => {
      // eslint-disable-next-line no-underscore-dangle
      if (re.user.toString() === req.user._id.toString()) {
        re.rating = Number(rating);
        re.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.numberOfReviews.length;
  }

  //adjust the rating
  product.rating =
    // eslint-disable-next-line array-callback-return
    product.reviews.reduce((acc, curr) => {
      curr.rating += acc;
    }, 0) / product.reviews.length;

  //save the product
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    message: 'Review added successfully',
    product,
  });
});

exports.deleteReview = BigPromise(async (req, res, next) => {
  // eslint-disable-next-line no-underscore-dangle
  const { productId } = req.query;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }

  //filter the reviews to remove the review of the user
  const reviews = product.reviews.filter(
    // eslint-disable-next-line no-underscore-dangle
    (rev) => rev.user.toString() === req.user._id.toString()
  );
  const numberOfReviews = reviews.length;

  //adjust the rating
  product.rating =
    // eslint-disable-next-line array-callback-return
    product.reviews.reduce((acc, item) => {
      item.rating += acc;
    }, 0) / product.reviews.length;

  //update the number of reviews
  await Product.findByIdAndUpdate(
    productId,
    {
      reviews,
      rating: product.rating,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    message: 'Review deleted successfully',
  });
});
// eslint-disable-next-line no-unused-vars
exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, _next) => {
  const product = await Product.findById(req.query.id);

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

exports.testProduct = async (_req, res) => {
  res.status(200).json({
    message: 'Product Controller',
  });
};

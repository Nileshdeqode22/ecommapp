const Order = require('../models/order');
const Product = require('../models/products');

const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../util/customError');

exports.createOrder = BigPromise(async (req, res) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    // eslint-disable-next-line no-underscore-dangle
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getOneOrder = BigPromise(async (req, res, next) => {
  //populate is used to get the user info from the user id
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );
  if (!order) {
    next(new CustomError('Order not found', 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getLoggedInOrders = BigPromise(async (req, res, next) => {
  // eslint-disable-next-line no-underscore-dangle
  const order = await Order.find({ user: req.user._id });
  if (!order) {
    next(new CustomError('Order not found', 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminGetAllOrders = BigPromise(async (_req, res, next) => {
  const order = await Order.find();
  if (!order) {
    next(new CustomError('Order not found', 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
}

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    next(new CustomError('Order not found', 404));
  }

  if (order.ordersStatus === 'Delivered') {
    next(new CustomError('Order is already delivered', 400));
  }

  order.ordersStatus = req.body.ordersStatus;
  order.orderItems.forEach(async (item) => {
    await updateProductStock(item.product, item.quantity);
  });
  await order.save();
  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    next(new CustomError('Order not found', 404));
  }
  await order.remove();
  res.status(200).json({
    success: true,
  });
});

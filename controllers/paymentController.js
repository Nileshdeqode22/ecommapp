/* eslint-disable no-unused-vars */
const Razorpay = require('razorpay');
const BigPromise = require('../middlewares/bigPromise');

exports.sendRazorPayKey = BigPromise(async (req, res, _next) => {
  res.status(200).json({
    key: process.env.RAZOR_KEY_ID,
  });
});

exports.captureRazorPayment = BigPromise(async (req, res, _next) => {
  const instance = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID,
    key_secret: process.env.RAZOR_KEY_SECRET,
  });
  const options = {
    amount: req.body.amount,
    currency: 'INR',
    receipt: req.body.receipt,
  };
  const payment = await instance.payments.capture(req.body.payment_id, options);
  res.status(200).json({
    payment,
  });
});

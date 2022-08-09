const express = require('express');

const router = express.Router();
const {
  sendRazorPayKey,
  captureRazorPayment,
} = require('../controllers/paymentController');
const { isLoggedIn } = require('../middlewares/user');

router.route('/razorpaykey').get(isLoggedIn, sendRazorPayKey);
router.route('/capturerazorpayment').post(isLoggedIn, captureRazorPayment);

module.exports = router;

const express = require('express');

const router = express.Router();
const { isLoggedIn, customRole } = require('../middlewares/user');
const {
  addProduct,
  testProduct,
  getAllProducts,
  getOneProduct,
  adminGetAllProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
  addReview,
  deleteReview,
  getOnlyReviewsForOneProduct,
} = require('../controllers/productController');

//User Routes
router.route('/testProduct').post(testProduct);
router.route('/products').get(getAllProducts);
router.route('/product/:id').get(getOneProduct);
router.route('/review').put(isLoggedIn, addReview);
router.route('/review').delete(isLoggedIn, deleteReview);
router.route('/reviews').get(isLoggedIn, getOnlyReviewsForOneProduct);

//Admin Route
router
  .route('/admin/product/add')
  .post(isLoggedIn, customRole('admin'), addProduct);

router
  .route('/admin/products')
  .get(isLoggedIn, customRole('admin'), adminGetAllProduct);

router
  .route('/admin/product/:id')
  .put(isLoggedIn, customRole('admin'), adminUpdateOneProduct)
  .delete(isLoggedIn, customRole('admin'), adminDeleteOneProduct);

module.exports = router;

const express = require('express');

const router = express.Router();
const {
  signup,
  login,
  logout,
  forgotPassword,
  passwordReset,
  getLoggedInUserDeatils,
  changePassword,
  updateUserDetails,
  managerAllUsers,
  adminAllUser,
  adminGetOneUser,
  adminUpdateOneUserDetails,
  adminDeleteOneUser,
} = require('../controllers/userController');
const { isLoggedIn, customRole } = require('../middlewares/user');

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgot-password').post(forgotPassword);
router.route('/password/reset/:token').post(passwordReset);
router.route('/userdashboard').get(isLoggedIn, getLoggedInUserDeatils);
router.route('/password/update').post(isLoggedIn, changePassword);
router.route('/update-user-details').post(isLoggedIn, updateUserDetails);

//Manager Routes
router
  .route('/manager/all-users')
  .get(isLoggedIn, customRole('manager'), managerAllUsers);

//Admin Routes
router
  .route('/admin/all-users')
  .get(isLoggedIn, customRole('admin'), adminAllUser);
router
  .route('/admin/:id')
  .get(isLoggedIn, customRole('admin'), adminGetOneUser)
  .put(isLoggedIn, customRole('admin'), adminUpdateOneUserDetails)
  .delete(isLoggedIn, customRole('admin'), adminDeleteOneUser);

module.exports = router;

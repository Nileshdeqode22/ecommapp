const jwt = require('jsonwebtoken');
const User = require('../models/users');
const CustomError = require('../util/customError');
const BigPromise = require('./bigPromise');

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  const token =
    req.cookies.token || req.header('Authorization').replace('Bearer ', '');
  if (!token) {
    return next(new CustomError('Please login to continue', 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  next();
});

exports.customRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError('You are not authorized to perform this action', 403)
      );
    }
    next();
  };
};

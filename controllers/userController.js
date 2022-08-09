/* eslint-disable no-unused-vars */
const cloudinary = require('cloudinary');

const crypto = require('crypto');
const User = require('../models/users');
const CustomError = require('../util/customError');
const BigPromise = require('../middlewares/bigPromise');
const cookieToken = require('../util/cookieToken');
const emailHelper = require('../util/emailHelper');

exports.signup = BigPromise(async (req, res, next) => {
  if (!req.files) {
    return next(new CustomError('photo is required for signup', 400));
  }

  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return next(new CustomError('Name, email and password are required', 400));
  }
  const file = req.files.photo;

  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: 'users',
    width: 150,
    crop: 'scale',
  });

  //create user and save to db
  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });
  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  //check presence of email and password
  if (!email || !password) {
    return next(new CustomError('please provide email and password', 400));
  }

  //get user from DB
  const user = await User.findOne({ email }).select('+password');

  //if user not found in DB
  if (!user) {
    return next(
      new CustomError("Email or password doesn't match or exist", 400)
    );
  }

  //match the password
  const isPasswordCorrect = await user.isValidatedPassword(password);

  //if password is not match
  if (!isPasswordCorrect) {
    return next(
      new CustomError("Email or password doesn't match or exist", 400)
    );
  }

  //if success sending token to user
  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logout Successfully',
  });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  //collect email
  const { email } = req.body;
  //find the user in db
  const user = await User.findOne({ email });

  //if user not found in the db
  if (!user) {
    return next(new CustomError('Email not found as registerd:', 400));
  }
  //get the token from user model
  const forgotToken = user.getForgotPasswordToken();
  // save the user fields in db
  //validateBeforeSave is used to validate the token and expiry
  await user.save({ validateBeforeSave: false });
  //create the url
  const url = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/password/reset/${forgotToken}`;

  //craft the message to be sent
  const message = `Copy paste the link in your URL and hit enter \n\n ${url}`;

  //attempt to send the email
  try {
    await emailHelper({
      email: user.email,
      subject: 'Ecomm-Password reset mail',
      message,
    });
    //json reseponse if email is success
    res.status(200).json({
      success: true,
      message: 'email sent successfully ',
    });
  } catch (error) {
    //reset the user field if thing goes wrong
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new CustomError(error.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  //get tokens from params
  const resetToken = req.params.token;
  //hash the token as db also stores hashed version
  const encryToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //find the user based on the token and time in future
  const user = await User.findOne({
    encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError('Invalid token', 400));
  }

  // check if the password and confirm password are same
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError('Password and confirm password are not same', 400)
    );
  }
  //update the password field in db
  user.password = req.body.password;

  //reset the token and expiry
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  //save the user
  await user.save({ validateBeforeSave: false });
  //send the response
  cookieToken(user, res);
});

exports.getLoggedInUserDeatils = BigPromise(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  //get user from middleware
  const userId = req.user.id;
  //get user from db
  const user = await User.findById(userId).select('+password');

  //check if old password is correct
  const isPasswordCorrect = await user.isValidatedPassword(
    req.body.oldPassword
  );
  if (!isPasswordCorrect) {
    return next(new CustomError('Old password is incorrect', 400));
  }
  //allow to change password only if old password is correct
  user.password = req.body.newPassword;
  await user.save();

  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  //add a check for email and name body is not empty
  if (!req.body.name || !req.body.email) {
    return next(new CustomError('Name and email are required', 400));
  }

  //collect data from body
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };
  //if photo comes to us
  if (req.files) {
    const user = await User.findById(req.user.id);
    const imageId = user.photo.id;
    //delete the image from cloudinary
    await cloudinary.v2.uploader.destroy(imageId);

    //upload the new image
    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: 'users',
        width: 150,
        height: 150,
        crop: 'scale',
      }
    );
    //add the new image to the newData object
    newData.photo = {
      id: result.public_id,
      url: result.secure_url,
    };
  }
  //upadate the user in db
  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
  });
  //send the response
  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.managerAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: 'user' });
  //send the response
  res.status(200).json({
    success: true,
    data: users,
  });
});

exports.adminAllUser = BigPromise(async (req, res, next) => {
  const user = await User.find();
  if (!user) {
    return next(new CustomError('User not found', 404));
  }
  //send the response
  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.adminGetOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomError('User not found', 404));
  }
  //send the response
  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
  //add a check for email and name body is not empty
  if (!req.body.name || !req.body.email) {
    return next(new CustomError('Name and email are required', 400));
  }

  //collect data from body
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  //upadate the user in db
  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
  });
  //send the response
  res.status(200).json({
    success: true,
  });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
  //get user from url
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomError('User not found', 404));
  }
  //get image id from user
  const imageId = user.photo.id;
  //delete the image from cloudinary
  await cloudinary.v2.uploader.destroy(imageId);
  //delete the user from db
  await user.remove();

  //send the response
  res.status(200).json({
    success: true,
    data: 'User deleted successfully',
  });
});

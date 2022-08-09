const cookieToken = (user, res) => {
  const token = user.getJwtToken();
  const Option = {
    expires: new Date(
      // Add 1 day to the current date
      Date.now() + 1000 * 60 * 60 * 24 * 7
    ),
    httpOnly: true,
  };
  user.password = undefined;
  res.status(201).cookie('token', token, Option).json({
    status: 201,
    message: 'User created successfully',
    token,
    user,
  });
};

module.exports = cookieToken;

const home = (req, res) => {
  res.status(200).json({
    succes: true,
    message: 'Welcome to Ecomm App',
  });
};
module.exports = home;

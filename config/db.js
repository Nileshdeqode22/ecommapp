const mongoose = require('mongoose');

const connectWithDb = () => {
  mongoose
    .connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.log('Error connecting to MongoDB');
      console.log(err);
      process.exit(1);
    });
};

module.exports = connectWithDb;

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    //required is a validator that checks if the field is not empty
    required: [true, 'Please provide the Product Name'],
    //trim to remove white space
    trim: true,
    maxlength: [50, 'Product Name cannot be more than 50 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide the Product Price'],
    maxlength: [10, 'Product Price cannot be more than 10 digits'],
  },
  description: {
    type: String,
    required: [true, 'Please provide the Product Description'],
  },
  //image is a file that is uploaded to cloudinary
  photos: [
    {
      id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [
      true,
      'please select category from- short-sleeves, long-sleeves, sweat-shirts, hoodies',
    ],
    //enum is used to check if the value is one of the values in the array
    enum: {
      values: ['shortsleeves', 'longsleeves', 'sweatshirts', 'hoodies'],
      message:
        'Please select category from- short-sleeves, long-sleeves, sweat-shirts, hoodies',
    },
  },
  stock: {
    type: Number,
    required: [true, 'Please provide the Product Stock'],
  },
  brand: {
    type: String,
    required: [true, 'Please provide the Product Brand'],
  },
  rating: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);

const dotenv =require('dotenv');
const cloudinary =require ('cloudinary');
const  app =require ('./app');
const connectWithDb =require ('./config/db');

dotenv.config();

//connect to mongoDB
connectWithDb();
//cloudinary config goes here
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

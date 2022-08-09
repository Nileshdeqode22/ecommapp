const nodeEmailer = require('nodemailer');

const mailHelper = async (option) => {
  const transporter = nodeEmailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const message = {
    from: 'nrajput@deqode.com',
    to: option.email,
    subject: option.subject,
    text: option.message,
  };

  //send the mail with defined transport object
  await transporter.sendMail(message);
};
module.exports = mailHelper;

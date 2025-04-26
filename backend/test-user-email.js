require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./models/userModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testUserEmails() {
  try {
    // Find all users in the database
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found in the database');
      return;
    }
    
    console.log(`Found ${users.length} users in the database`);
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('Email transporter created');
    
    // Send a test email to each user
    for (const user of users) {
      console.log(`Sending test email to user: ${user.name} (${user.email})`);
      
      const info = await transporter.sendMail({
        from: `"WasteNot App" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "WasteNot User Email Test",
        html: `
          <h2>Hello ${user.name}!</h2>
          <p>This is a test email from WasteNot to verify that our alert system can reach your email address.</p>
          <p>If you're receiving this, it means our food expiration alert system is working correctly!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        `
      });
      
      console.log(`Email sent to ${user.email}, Message ID: ${info.messageId}`);
    }
    
    console.log('All test emails sent successfully!');
  } catch (error) {
    console.error('Error sending test emails:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run the test
testUserEmails()
  .then(() => console.log('User email test completed'))
  .catch(err => console.error('Test failed:', err));

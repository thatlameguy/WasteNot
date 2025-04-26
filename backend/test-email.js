require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailSending() {
  try {
    // Log all environment variables for debugging
    console.log('Environment variables:');
    console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '[SET]' : '[NOT SET]'}`);
    console.log(`EMAIL_SECURE: ${process.env.EMAIL_SECURE}`);
    
    // Create a test transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true // Enable debug output
    });
    
    console.log('Created transporter');
    
    // Verify connection
    await transporter.verify();
    console.log('Transporter verification successful');
    
    // Send a test email
    const info = await transporter.sendMail({
      from: `"WasteNot Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "WasteNot Email Test",
      html: `
        <h2>WasteNot Email Test</h2>
        <p>This is a test email to verify email sending is working.</p>
        <p>Time sent: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('Error sending test email:');
    console.error(error);
  }
}

testEmailSending()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));

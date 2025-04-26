const mongoose = require('mongoose');

// Suppress the strictQuery deprecation warning
mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    // Added more connection options to handle various issues
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      family: 4 // Use IPv4, avoid IPv6 issues
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error Connecting to MongoDB: ${error.message}`);
    console.error(`Full Error: ${JSON.stringify(error, null, 2)}`);
    process.exit(1);
  }
};

module.exports = connectDB;
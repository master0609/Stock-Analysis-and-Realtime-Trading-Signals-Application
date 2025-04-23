const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables, use default if not set
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_analysis';
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up indexes for performance
    await setupIndexes();
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Setup database indexes for better performance
const setupIndexes = async () => {
  try {
    // Indexes are defined in the model schemas
    await mongoose.model('User').createIndexes();
    await mongoose.model('Stock').createIndexes();
  } catch (error) {
    console.error(`Error setting up indexes: ${error.message}`);
  }
};

module.exports = connectDB;

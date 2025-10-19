const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const databaseUrl = process.env.MONGODB_URI;

        const conn = await mongoose.connect(databaseUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected with Success`);
    } catch (error) {
        console.error('Database connection error:', error.message);
        process.exit(1);
    }
}


mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});


mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});


module.exports = connectDB;
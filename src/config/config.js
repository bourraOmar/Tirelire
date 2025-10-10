require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/tirelireDB',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
};
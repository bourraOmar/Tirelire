const express = require('express');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/ErrorHandler');
const kycRoutes = require('./routes/kycRoutes');

const app = express();

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);

app.use('/api/kyc', kycRoutes);

app.get('/', (req,res) => {
  res.json({message: 'Tirelire API is running!'});
});

app.use(errorHandler);
module.exports = app;
 
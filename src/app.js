const express = require('express');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/ErrorHandler');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req,res) => {
  res.json({message: 'Tirelire API is running!'});
});

app.use(errorHandler);
module.exports = app;
 
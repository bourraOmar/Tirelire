require('dotenv').config();
const connectDB = require('./config/config');
const configureApp = require('./config/appSettings');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const kycRoutes = require('./routes/kycRoutes');
const messageRoutes = require('./routes/messageRoutes');
const errorHandler = require('./middleware/ErrorHandler');

connectDB();

const app = configureApp();
const PORT = process.env.PORT || 5000;

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/messages', messageRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: `Route ${req.originalUrl} not found`
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port http://localhost:${PORT}`);
});
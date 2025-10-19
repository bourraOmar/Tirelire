const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'MAD' },
        method: { type: String, enum: ['credit_card', 'paypal', 'cash'], required: true },
        status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
        transactionId: { type: String, unique: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
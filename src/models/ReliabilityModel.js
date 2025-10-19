const mongoose = require('mongoose');

const reliabilitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    latePayments: { type: Number, default: 0 },
    missedPayments: { type: Number, default: 0 },
    bonuses: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Reliability', reliabilitySchema);
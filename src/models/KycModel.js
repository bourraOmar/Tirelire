const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true },
    idCardImage: { type: String, required: true },
    selfieImage: { type: String },
    isVerByAI: { type: Boolean, default: false },
    isVerByAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('KYC', kycSchema);
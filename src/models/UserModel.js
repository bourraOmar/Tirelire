const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ['admin', 'user'], default: 'user' },
        avatar: { type: String, default: '' },
        bio: { type: String, default: '' },
        groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
        payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
        messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
        tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    isCompleted: { type: Boolean, default: false },
    totalReceived: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Turn', turnSchema);
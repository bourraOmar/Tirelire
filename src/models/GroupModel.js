const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
        isPrivate: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
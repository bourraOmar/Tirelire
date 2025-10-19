const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
        content: { type: String, required: true },
        attachments: [{ type: String }],
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
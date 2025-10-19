const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        subject: { type: String, required: true },
        description: { type: String, required: true },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        responses: [
            {
                message: String,
                responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                date: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
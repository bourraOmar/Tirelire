const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
    joinDate: { type: Date, default: Date.now },
    reliabilityAtJoin: { type: Number, default: 100 },
    turnOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
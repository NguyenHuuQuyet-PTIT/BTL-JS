const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['sinh-vien', 'giang-vien', 'admin']
    },
    dob: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    readNotifs: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);

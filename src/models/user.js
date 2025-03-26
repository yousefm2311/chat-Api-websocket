const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30,
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent returning password in responses
UserSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model('User', UserSchema);
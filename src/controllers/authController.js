const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validationResult } = require('express-validator');

// Token generation helper
const generateToken = (userId, username) => {
    return jwt.sign(
        { id: userId, username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

// Login controller
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Case-insensitive search
        const user = await User.findOne({ 
            username: { $regex: new RegExp(`^${username}$`, 'i') } 
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user._id, user.username);
        
        res.json({ 
            token,
            user: {
                id: user._id,
                username: user.username,
                createdAt: user.createdAt
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Registration controller
const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check for existing user (case-insensitive)
        const existingUser = await User.findOne({ 
            username: { $regex: new RegExp(`^${username}$`, 'i') } 
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            username: username.toLowerCase(),
            password: hashedPassword
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id, user.username);
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                createdAt: user.createdAt
            }
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { login, register };
import express from 'express';

import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import { generateToken } from '../services/authServices';

const router = express.Router();

// Register new user
router.post('/register', async (req: any, res: any) => {
    try {
        const { fullname, username, email, password, bio } = req.body;

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const user = await User.create({
            id: uuidv4(),
            fullname,
            username,
            email,
            bio,
            password // Password will be hashed by the beforeCreate hook
        });

        // Generate JWT token
        const token = generateToken(user.id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 365 * 24 * 60 * 60 * 1000 // 365 days
        });

        return res.status(201).json({
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Error && error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        return res.status(500).json({ message: 'Server error during registration' });
    }
});

// --- Login Route ---
router.post('/login', async (req: any, res: any) => {
    try {
        const { usernameOrEmail, password } = req.body;

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail },
                ],
            },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 365 * 24 * 60 * 60 * 1000 // 365 days
        });

        return res.json({
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
});

// Logout
router.post('/logout', (req: any, res: any) => {
    res.clearCookie('token');
    return res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', auth, async (req: any, res: any) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            user: {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

export default router;
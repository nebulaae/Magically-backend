import { Op } from 'sequelize';
import { User } from '../models/User';
import { Request, Response } from 'express';
import { generateToken } from '../services/authService';

// --- Register New User ---
export const register = async (req: Request, res: Response) => {
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

        // Exclude password from the response
        const { password: _, ...userResponse } = user.get({ plain: true });

        return res.status(201).json({
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Error && error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        return res.status(500).json({ message: 'Server error during registration' });
    }
};

// --- Login User ---
export const login = async (req: Request, res: Response) => {
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
        
        // Exclude password from the response
        const { password: _, ...userResponse } = user.get({ plain: true });

        return res.json({
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};

// --- Logout User ---
export const logout = (req: Request, res: Response) => {
    res.clearCookie('token');
    return res.json({ message: 'Logged out successfully' });
};

// --- Get Current User ---
export const getMe = async (req: Request, res: Response) => {
    try {
        // req.user is attached by the auth middleware
        const user = req.user; 

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Exclude password from the response
        const { password, ...userResponse } = user.get({ plain: true });

        return res.json({
            user: userResponse
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
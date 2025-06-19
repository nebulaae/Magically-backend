"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.register = void 0;
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
const authService_1 = require("../services/authService");
// --- Register New User ---
const register = async (req, res) => {
    try {
        const { fullname, username, email, password, bio } = req.body;
        const existingUser = await User_1.User.findOne({
            where: {
                [sequelize_1.Op.or]: [{ username }, { email }]
            }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        const user = await User_1.User.create({
            fullname,
            username,
            email,
            bio,
            password // Password will be hashed by the beforeCreate hook
        });
        // Generate JWT token
        const token = (0, authService_1.generateToken)(user.id);
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 365 * 24 * 60 * 60 * 1000 // 365 days
        });
        // Exclude password from the response
        const _a = user.get({ plain: true }), { password: _ } = _a, userResponse = __rest(_a, ["password"]);
        return res.status(201).json({
            token,
            user: userResponse
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Error && error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error during registration' });
    }
};
exports.register = register;
// --- Login User ---
const login = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;
        const user = await User_1.User.findOne({
            where: {
                [sequelize_1.Op.or]: [
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
        const token = (0, authService_1.generateToken)(user.id);
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 365 * 24 * 60 * 60 * 1000 // 365 days
        });
        // Exclude password from the response
        const _a = user.get({ plain: true }), { password: _ } = _a, userResponse = __rest(_a, ["password"]);
        return res.json({
            token,
            user: userResponse
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};
exports.login = login;
// --- Logout User ---
const logout = (req, res) => {
    res.clearCookie('token');
    return res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
// --- Get Current User ---
const getMe = async (req, res) => {
    try {
        // req.user is attached by the auth middleware
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Exclude password from the response
        const _a = user.get({ plain: true }), { password } = _a, userResponse = __rest(_a, ["password"]);
        return res.json({
            user: userResponse
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=authController.js.map
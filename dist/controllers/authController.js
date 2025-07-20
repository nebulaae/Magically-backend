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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.getMe = exports.logout = exports.login = exports.register = exports.registerStep3 = exports.registerStep2 = exports.registerStep1 = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
const authService_1 = require("../services/authService");
const emailService_1 = require("../services/emailService");
const passwordService_1 = require("../services/passwordService");
// --- Step 1: Register Email and Send OTP ---
const registerStep1 = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
        const existingUser = await User_1.User.findOne({ where: { email } });
        if (existingUser && existingUser.verified) {
            return res.status(400).json({ message: 'Email already in use.' });
        }
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const hashedOtp = await bcrypt_1.default.hash(otp, 10);
        if (existingUser) {
            existingUser.otp = hashedOtp;
            existingUser.otpExpires = otpExpires;
            await existingUser.save();
        }
        else {
            await User_1.User.create({ email, otp: hashedOtp, otpExpires });
        }
        await (0, emailService_1.sendVerificationEmail)(email, otp);
        return res.status(200).json({ message: 'OTP sent to your email.' });
    }
    catch (error) {
        console.error('Register Step 1 Error:', error);
        return res.status(500).json({ message: 'Server error during registration step 1.' });
    }
};
exports.registerStep1 = registerStep1;
// --- Step 2: Verify OTP ---
const registerStep2 = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.' });
        }
        const user = await User_1.User.findOne({ where: { email } });
        if (!user || !user.otp || !user.otpExpires) {
            return res.status(400).json({ message: 'Invalid request. Please try again.' });
        }
        if (new Date() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP has expired.' });
        }
        const isMatch = await bcrypt_1.default.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }
        user.verified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        return res.status(200).json({ message: 'Email verified successfully.' });
    }
    catch (error) {
        console.error('Register Step 2 Error:', error);
        return res.status(500).json({ message: 'Server error during OTP verification.' });
    }
};
exports.registerStep2 = registerStep2;
// --- Step 3: Complete Registration ---
const registerStep3 = async (req, res) => {
    try {
        const { email, fullname, username, password } = req.body;
        if (!email || !fullname || !username || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const user = await User_1.User.findOne({ where: { email, verified: true } });
        if (!user) {
            return res.status(400).json({ message: 'Email not verified or user not found.' });
        }
        const existingUsername = await User_1.User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken.' });
        }
        user.fullname = fullname;
        user.username = username;
        user.password = password; // Hashed by beforeUpdate hook
        await user.save();
        const token = (0, authService_1.generateToken)(user.id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        const _a = user.get({ plain: true }), { password: _ } = _a, userResponse = __rest(_a, ["password"]);
        return res.status(201).json({ token, user: userResponse });
    }
    catch (error) {
        console.error('Register Step 3 Error:', error);
        return res.status(500).json({ message: 'Server error during final registration step.' });
    }
};
exports.registerStep3 = registerStep3;
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
// --- Forgot Password Controller ---
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
        await (0, passwordService_1.handleForgotPassword)(email);
        return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }
    catch (error) {
        console.error('Forgot Password Error:', error);
        return res.status(500).json({ message: 'Server error during forgot password process.' });
    }
};
exports.forgotPassword = forgotPassword;
// --- Reset Password Controller ---
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: "Password is required." });
        }
        const users = await User_1.User.findAll({
            where: {
                passwordResetTokenExpires: { [sequelize_1.Op.gt]: new Date() }
            }
        });
        let userToUpdate = null;
        for (const user of users) {
            if (user.passwordResetToken && await bcrypt_1.default.compare(token, user.passwordResetToken)) {
                userToUpdate = user;
                break;
            }
        }
        if (!userToUpdate) {
            return res.status(400).json({ message: 'Token is invalid or has expired.' });
        }
        userToUpdate.password = password; // Will be hashed by hook
        userToUpdate.passwordResetToken = undefined;
        userToUpdate.passwordResetTokenExpires = undefined;
        await userToUpdate.save();
        return res.status(200).json({ message: 'Password has been reset successfully.' });
    }
    catch (error) {
        console.error('Reset Password Error:', error);
        return res.status(500).json({ message: 'Server error during password reset.' });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map
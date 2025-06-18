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
exports.unsubscribe = exports.subscribe = exports.searchUsers = exports.updateAvatar = exports.updateProfile = exports.getMe = exports.getProfile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
const Publication_1 = require("../models/Publication");
// --- Get User Profile ---
const getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User_1.User.findOne({
            where: { username },
            attributes: { exclude: ['password', 'email'] }, // Don't expose sensitive info
            include: [
                {
                    model: Publication_1.Publication,
                    as: 'publications',
                    attributes: ['id', 'content', 'imageUrl', 'createdAt']
                },
                {
                    model: User_1.User,
                    as: 'Followers',
                    attributes: ['id', 'username', 'avatar'],
                    through: { attributes: [] } // Don't include the join table attributes
                },
                {
                    model: User_1.User,
                    as: 'Following',
                    attributes: ['id', 'username', 'avatar'],
                    through: { attributes: [] }
                }
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProfile = getProfile;
// --- Get Current Authenticated User Profile ---
const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findByPk(userId, {
            attributes: { exclude: ['password', 'email'] },
            include: [
                {
                    model: Publication_1.Publication,
                    as: 'publications',
                    attributes: ['id', 'content', 'imageUrl', 'createdAt']
                },
                {
                    model: User_1.User,
                    as: 'Followers',
                    attributes: ['id', 'username', 'avatar'],
                    through: { attributes: [] }
                },
                {
                    model: User_1.User,
                    as: 'Following',
                    attributes: ['id', 'username', 'avatar'],
                    through: { attributes: [] }
                }
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get current user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;
// --- Update Current User's Profile ---
const updateProfile = async (req, res) => {
    try {
        const { fullname, bio, interests } = req.body;
        const userId = req.user.id;
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.fullname = fullname || user.fullname;
        user.bio = bio || user.bio;
        // Ensure interests is an array
        if (Array.isArray(interests)) {
            user.interests = interests;
        }
        await user.save();
        const _a = user.get({ plain: true }), { password } = _a, userResponse = __rest(_a, ["password"]);
        res.json({ message: 'Profile updated successfully', user: userResponse });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProfile = updateProfile;
// --- Update User Avatar ---
const updateAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // If user already has an avatar, delete the old one
        if (user.avatar) {
            const oldAvatarPath = path_1.default.join(__dirname, '../../public', user.avatar);
            if (fs_1.default.existsSync(oldAvatarPath)) {
                fs_1.default.unlinkSync(oldAvatarPath);
            }
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        // The path should be a URL path, not a file system path
        const avatarUrlPath = `/users/avatars/${req.file.filename}`;
        user.avatar = avatarUrlPath;
        await user.save();
        const _a = user.get({ plain: true }), { password } = _a, userResponse = __rest(_a, ["password"]);
        res.json({ message: 'Avatar updated successfully', user: userResponse });
    }
    catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateAvatar = updateAvatar;
// --- Search for Users ---
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const users = await User_1.User.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { username: { [sequelize_1.Op.iLike]: `%${query}%` } }, // Case-insensitive search
                    { fullname: { [sequelize_1.Op.iLike]: `%${query}%` } }
                ]
            },
            attributes: ['id', 'username', 'fullname', 'bio', 'avatar'],
            limit: 10
        });
        res.json(users);
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.searchUsers = searchUsers;
// --- Subscribe (Follow) a User ---
const subscribe = async (req, res) => {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;
        if (followerId === followingId) {
            return res.status(400).json({ message: "You cannot follow yourself." });
        }
        const userToFollow = await User_1.User.findByPk(followingId);
        if (!userToFollow) {
            return res.status(404).json({ message: 'User to follow not found' });
        }
        const me = await User_1.User.findByPk(followerId);
        await me.addFollowing(userToFollow);
        res.status(200).json({ message: `Successfully followed ${userToFollow.username}` });
    }
    catch (error) {
        console.error('Subscribe error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'You are already following this user.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.subscribe = subscribe;
// --- Unsubscribe (Unfollow) a User ---
const unsubscribe = async (req, res) => {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;
        const userToUnfollow = await User_1.User.findByPk(followingId);
        if (!userToUnfollow) {
            return res.status(404).json({ message: 'User to unfollow not found' });
        }
        const me = await User_1.User.findByPk(followerId);
        const result = await me.removeFollowing(userToUnfollow);
        if (result === null) {
            return res.status(404).json({ message: "You are not following this user." });
        }
        res.status(200).json({ message: `Successfully unfollowed ${userToUnfollow.username}` });
    }
    catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.unsubscribe = unsubscribe;
//# sourceMappingURL=userController.js.map
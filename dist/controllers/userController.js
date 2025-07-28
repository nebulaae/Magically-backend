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
exports.getFollowing = exports.getFollowers = exports.unsubscribe = exports.subscribe = exports.searchUsers = exports.updateAvatar = exports.updateProfile = exports.getMyFollowings = exports.getMyFollowers = exports.getMe = exports.getProfile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
const utils_1 = require("../lib/utils");
const Subscription_1 = require("../models/Subscription");
const LikedPublication_1 = require("../models/LikedPublication");
// Helper function from publicationController - assuming it's exported or moved to a shared service
const addExtraInfoToPublications = async (publications, userId) => {
    const authorIds = publications.map(p => p.userId);
    const publicationIds = publications.map(p => p.id);
    const following = await Subscription_1.Subscription.findAll({
        where: { followerId: userId, followingId: { [sequelize_1.Op.in]: authorIds } },
    });
    const followingIds = new Set(following.map(sub => sub.followingId));
    const liked = await LikedPublication_1.LikedPublication.findAll({
        where: { userId: userId, publicationId: { [sequelize_1.Op.in]: publicationIds } },
    });
    const likedPublicationIds = new Set(liked.map(like => like.publicationId));
    return publications.map(p => {
        const publicationJson = p.toJSON();
        return Object.assign(Object.assign({}, publicationJson), { isFollowing: followingIds.has(p.userId), isLiked: likedPublicationIds.has(p.id) });
    });
};
// Helper function to add isFollowing flag to a list of users
const addIsFollowingInfoToUsers = async (users, currentUserId) => {
    const userIds = users.map(u => u.id);
    const subscriptions = await Subscription_1.Subscription.findAll({
        where: {
            followerId: currentUserId,
            followingId: { [sequelize_1.Op.in]: userIds }
        }
    });
    const followingIds = new Set(subscriptions.map(s => s.followingId));
    return users.map(user => {
        const userJson = user.toJSON();
        delete userJson.password; // ensure password is not returned
        return Object.assign(Object.assign({}, userJson), { isFollowing: followingIds.has(user.id) });
    });
};
// --- Get User Profile ---
const getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUser = req.user;
        const user = await User_1.User.findOne({
            where: { username },
            attributes: { exclude: ['password', 'email'] },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const publications = await user.getPublications({
            include: [{ model: User_1.User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
            order: [['createdAt', 'DESC']]
        });
        const publicationsWithInfo = await addExtraInfoToPublications(publications, currentUser.id);
        const publicationsCount = publications.length;
        const followersCount = (await user.getFollowers()).length;
        const followingCount = (await user.getFollowing()).length;
        let isFollowing = false;
        if (currentUser && currentUser.id !== user.id) {
            const subscription = await Subscription_1.Subscription.findOne({
                where: {
                    followerId: currentUser.id,
                    followingId: user.id
                }
            });
            isFollowing = !!subscription;
        }
        else if (currentUser && currentUser.id === user.id) {
            isFollowing = false; // You don't follow yourself
        }
        const userResponse = user.get({ plain: true });
        res.json(Object.assign(Object.assign({}, userResponse), { publicationsCount,
            followersCount,
            followingCount,
            isFollowing, publications: publicationsWithInfo // [NEW] Return publications
         }));
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
            attributes: { exclude: ['password'] }, // email can be included for self-profile
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const publications = await user.getPublications({
            include: [{ model: User_1.User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
            order: [['createdAt', 'DESC']]
        });
        const publicationsWithInfo = await addExtraInfoToPublications(publications, userId);
        const publicationsCount = publications.length;
        const followersCount = (await user.getFollowers()).length;
        const followingCount = (await user.getFollowing()).length;
        const userResponse = user.get({ plain: true });
        res.json(Object.assign(Object.assign({}, userResponse), { publicationsCount,
            followersCount,
            followingCount, publications: publicationsWithInfo // [NEW] Return publications
         }));
    }
    catch (error) {
        console.error('Get current user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;
// --- Get My Followers ---
const getMyFollowers = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followers = await user.getFollowers({
            attributes: ['id', 'username', 'fullname', 'avatar']
        });
        const followersWithInfo = await addIsFollowingInfoToUsers(followers, userId);
        res.json(followersWithInfo);
    }
    catch (error) {
        console.error('Get my followers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMyFollowers = getMyFollowers;
// --- Get My Followings ---
const getMyFollowings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followings = await user.getFollowing({
            attributes: ['id', 'username', 'fullname', 'avatar']
        });
        const followingsWithInfo = await addIsFollowingInfoToUsers(followings, userId);
        res.json(followingsWithInfo);
    }
    catch (error) {
        console.error('Get my followings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMyFollowings = getMyFollowings;
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
        if (user.avatar) {
            const oldAvatarPath = path_1.default.join(__dirname, '../../public', user.avatar);
            if (fs_1.default.existsSync(oldAvatarPath)) {
                fs_1.default.unlinkSync(oldAvatarPath);
            }
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
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
        const currentUserId = req.user.id;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const users = await User_1.User.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { username: { [sequelize_1.Op.iLike]: `%${query}%` } },
                    { fullname: { [sequelize_1.Op.iLike]: `%${query}%` } }
                ],
                id: { [sequelize_1.Op.ne]: currentUserId } // Exclude self from search results
            },
            attributes: ['id', 'username', 'fullname', 'bio', 'avatar'],
            limit: 10
        });
        const usersWithFollowingInfo = await addIsFollowingInfoToUsers(users, currentUserId);
        res.json(usersWithFollowingInfo);
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
        await database_1.default.transaction(async (t) => {
            await (0, utils_1.handleUserAction)(me, 10, t);
        });
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
// --- Get User's Followers ---
const getFollowers = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user.id;
        const user = await User_1.User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followers = await user.getFollowers({
            attributes: ['id', 'username', 'fullname', 'avatar']
        });
        const followersWithInfo = await addIsFollowingInfoToUsers(followers, currentUserId);
        res.json(followersWithInfo);
    }
    catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getFollowers = getFollowers;
// --- Get User's Following ---
const getFollowing = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user.id;
        const user = await User_1.User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const following = await user.getFollowing({
            attributes: ['id', 'username', 'fullname', 'avatar']
        });
        const followingWithInfo = await addIsFollowingInfoToUsers(following, currentUserId);
        res.json(followingWithInfo);
    }
    catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getFollowing = getFollowing;
//# sourceMappingURL=userController.js.map
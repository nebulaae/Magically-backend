import fs from 'fs';
import path from 'path';

import { Op } from 'sequelize';
import { User } from '../models/User';
import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription'; // Import Subscription model

// --- Helper function for AI Classification (Placeholder) ---
// In a real application, this would involve calling an external ML service
// or using a library like @tensorflow/tfjs-node for inference.
async function classifyContent(content: string, imageUrl?: string): Promise<string> {
    // Placeholder for AI classification
    // For demonstration, let's just return a static category or infer based on keywords.
    if (imageUrl) {
        // Imagine calling an image classification model here
        // Example: if image recognition determines it's a "cat" or "food"
        return "Image_Content"; // Or more specific categories like "Nature", "Animals", "Art"
    } else {
        // Imagine calling a text classification model here
        if (content.toLowerCase().includes('news') || content.toLowerCase().includes('current events')) return 'News';
        if (content.toLowerCase().includes('tech') || content.toLowerCase().includes('software')) return 'Technology';
        if (content.toLowerCase().includes('food') || content.toLowerCase().includes('recipe')) return 'Food';
        if (content.toLowerCase().includes('travel') || content.toLowerCase().includes('adventure')) return 'Travel';
        return 'General';
    }
}

// --- Get User Profile ---
export const getProfile = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const currentUser = req.user; // Authenticated user from middleware

        const user = await User.findOne({
            where: { username },
            attributes: { exclude: ['password', 'email'] }, // Don't expose sensitive info
            // Do NOT include associations here if you only need counts
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get counts directly
        const publicationsCount = (await user.getPublications()).length;
        const followersCount = (await user.getFollowers()).length;
        const followingCount = (await user.getFollowing()).length;
        
        // Check if the current authenticated user is following this profile
        let isFollowing = false;
        if (currentUser && currentUser.id !== user.id) {
            const subscription = await Subscription.findOne({
                where: {
                    followerId: currentUser.id,
                    followingId: user.id
                }
            });
            isFollowing = !!subscription; // True if subscription exists, false otherwise
        } else if (currentUser && currentUser.id === user.id) {
            // If it's the current user's own profile, they are "following" themselves in a conceptual sense
            // or you can set this to false depending on your UI/logic needs.
            // For simplicity, let's keep it true if it's their own profile.
            isFollowing = true;
        }

        const userResponse = user.get({ plain: true });

        res.json({
            ...userResponse,
            publicationsCount,
            followersCount,
            followingCount,
            isFollowing // New: Indicate if current user is following this profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Get Current Authenticated User Profile ---
export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'email'] },
            // Do NOT include associations here if you only need counts
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get counts directly
        const publicationsCount = (await user.getPublications()).length;
        const followersCount = (await user.getFollowers()).length;
        const followingCount = (await user.getFollowing()).length;

        const userResponse = user.get({ plain: true });

        res.json({
            ...userResponse,
            publicationsCount,
            followersCount,
            followingCount,
        });
    } catch (error) {
        console.error('Get current user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Update Current User's Profile ---
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { fullname, bio, interests } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);
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

        const { password, ...userResponse } = user.get({ plain: true });
        res.json({ message: 'Profile updated successfully', user: userResponse });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Update User Avatar ---
export const updateAvatar = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If user already has an avatar, delete the old one
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '../../public', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // The path should be a URL path, not a file system path
        const avatarUrlPath = `/users/avatars/${req.file.filename}`;
        user.avatar = avatarUrlPath;
        await user.save();

        const { password, ...userResponse } = user.get({ plain: true });
        res.json({ message: 'Avatar updated successfully', user: userResponse });

    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// --- Search for Users ---
export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { username: { [Op.iLike]: `%${query}%` } }, // Case-insensitive search
                    { fullname: { [Op.iLike]: `%${query}%` } }
                ]
            },
            attributes: ['id', 'username', 'fullname', 'bio', 'avatar'],
            limit: 10
        });

        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Subscribe (Follow) a User ---
export const subscribe = async (req: Request, res: Response) => {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;

        if (followerId === followingId) {
            return res.status(400).json({ message: "You cannot follow yourself." });
        }

        const userToFollow = await User.findByPk(followingId);
        if (!userToFollow) {
            return res.status(404).json({ message: 'User to follow not found' });
        }

        const me = await User.findByPk(followerId);
        await me.addFollowing(userToFollow);

        res.status(200).json({ message: `Successfully followed ${userToFollow.username}` });
    } catch (error) {
        console.error('Subscribe error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'You are already following this user.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Unsubscribe (Unfollow) a User ---
export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;

        const userToUnfollow = await User.findByPk(followingId);
        if (!userToUnfollow) {
            return res.status(404).json({ message: 'User to unfollow not found' });
        }

        const me = await User.findByPk(followerId);
        const result = await me.removeFollowing(userToUnfollow);

        if (result === null) {
            return res.status(404).json({ message: "You are not following this user." });
        }

        res.status(200).json({ message: `Successfully unfollowed ${userToUnfollow.username}` });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
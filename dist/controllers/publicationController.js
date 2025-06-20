"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedPublications = exports.getMyLikedPublications = exports.unlikePublication = exports.likePublication = exports.updatePublication = exports.getPublicationById = exports.getAllPublications = exports.createPublication = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
const Publication_1 = require("../models/Publication");
const Subscription_1 = require("../models/Subscription");
const LikedPublication_1 = require("../models/LikedPublication");
const classificationService_1 = require("../services/classificationService");
// Ensure the directory for publication images exists
const publicationImageDir = path_1.default.join(__dirname, '../../public/publications');
if (!fs_1.default.existsSync(publicationImageDir)) {
    fs_1.default.mkdirSync(publicationImageDir, { recursive: true });
}
// Helper function to add isFollowing and isLiked flags
const addExtraInfoToPublications = async (publications, userId) => {
    const authorIds = publications.map(p => p.userId);
    const publicationIds = publications.map(p => p.id);
    // Find which authors the user is following
    const following = await Subscription_1.Subscription.findAll({
        where: {
            followerId: userId,
            followingId: {
                [sequelize_1.Op.in]: authorIds,
            },
        },
    });
    const followingIds = new Set(following.map(sub => sub.followingId));
    // Find which publications the user has liked
    const liked = await LikedPublication_1.LikedPublication.findAll({
        where: {
            userId: userId,
            publicationId: {
                [sequelize_1.Op.in]: publicationIds,
            },
        },
    });
    const likedPublicationIds = new Set(liked.map(like => like.publicationId));
    // Return publications with the new fields
    return publications.map(p => {
        const publicationJson = p.toJSON();
        return Object.assign(Object.assign({}, publicationJson), { isFollowing: followingIds.has(p.userId), isLiked: likedPublicationIds.has(p.id) });
    });
};
// --- Create Publication ---
const createPublication = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;
        let imageUrl;
        if (req.file) {
            imageUrl = `/publications/${req.file.filename}`;
        }
        if (!content && !imageUrl) {
            return res.status(400).json({ message: 'Publication must have content or an image.' });
        }
        // Classify the content/image using the new classification service
        const category = await (0, classificationService_1.classifyContent)(content, imageUrl);
        const publication = await Publication_1.Publication.create({
            userId,
            content,
            imageUrl,
            category, // Save the classified category
        });
        res.status(201).json({ message: 'Publication created successfully', publication });
    }
    catch (error) {
        console.error('Create publication error:', error);
        res.status(500).json({ message: 'Server error during publication creation' });
    }
};
exports.createPublication = createPublication;
// --- Get All Publications (Feed) ---
const getAllPublications = async (req, res) => {
    try {
        const userId = req.user.id;
        const publications = await Publication_1.Publication.findAll({
            order: [['createdAt', 'DESC']], // Latest first
            include: [
                {
                    model: User_1.User,
                    as: 'author',
                    attributes: ['id', 'username', 'fullname', 'avatar']
                }
            ]
        });
        const publicationsWithInfo = await addExtraInfoToPublications(publications, userId);
        res.json(publicationsWithInfo);
    }
    catch (error) {
        console.error('Get all publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllPublications = getAllPublications;
// --- Get Single Publication by ID ---
const getPublicationById = async (req, res) => {
    try {
        const { publicationId } = req.params;
        const userId = req.user.id;
        const publication = await Publication_1.Publication.findByPk(publicationId, {
            include: [
                {
                    model: User_1.User,
                    as: 'author',
                    attributes: ['id', 'username', 'fullname', 'avatar']
                }
            ]
        });
        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        const publicationsWithInfo = await addExtraInfoToPublications([publication], userId);
        res.json(publicationsWithInfo[0]);
    }
    catch (error) {
        console.error('Get publication by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPublicationById = getPublicationById;
// --- [NEW] Update a Publication ---
const updatePublication = async (req, res) => {
    try {
        const { publicationId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const publication = await Publication_1.Publication.findByPk(publicationId);
        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        // Check if the user is the author of the publication
        if (publication.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to edit this publication' });
        }
        publication.content = content || publication.content;
        // Re-classify content if it has changed
        if (content) {
            publication.category = await (0, classificationService_1.classifyContent)(content, publication.imageUrl);
        }
        await publication.save();
        res.json({ message: 'Publication updated successfully', publication });
    }
    catch (error) {
        console.error('Update publication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updatePublication = updatePublication;
// --- Like a Publication ---
const likePublication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { publicationId } = req.params;
        const publication = await Publication_1.Publication.findByPk(publicationId);
        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Add the publication to the user's liked publications
        await user.addLikedPublication(publication);
        // Add the publication's category to user's interests if not already present
        if (publication.category) {
            const currentInterests = user.interests || [];
            if (!currentInterests.includes(publication.category)) {
                user.interests = [...currentInterests, publication.category];
                await user.save();
            }
        }
        res.status(200).json({ message: 'Publication liked successfully' });
    }
    catch (error) {
        console.error('Like publication error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'You have already liked this publication.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.likePublication = likePublication;
// --- Unlike a Publication ---
const unlikePublication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { publicationId } = req.params;
        const publication = await Publication_1.Publication.findByPk(publicationId);
        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const result = await user.removeLikedPublication(publication);
        if (result === null) { // Sequelize returns 0 if no row was deleted
            return res.status(404).json({ message: 'You have not liked this publication.' });
        }
        res.status(200).json({ message: 'Publication unliked successfully' });
    }
    catch (error) {
        console.error('Unlike publication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.unlikePublication = unlikePublication;
// --- Get Liked Publications for Current User ---
const getMyLikedPublications = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const likedPublications = await user.getLikedPublications({
            include: [
                {
                    model: User_1.User,
                    as: 'author',
                    attributes: ['id', 'username', 'fullname', 'avatar']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        const publicationsWithInfo = await addExtraInfoToPublications(likedPublications, userId);
        res.json(publicationsWithInfo);
    }
    catch (error) {
        console.error('Get liked publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMyLikedPublications = getMyLikedPublications;
// --- Get Recommended Publications based on interests ---
const getRecommendedPublications = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findByPk(userId, {
            include: [{
                    model: Publication_1.Publication,
                    as: 'likedPublications'
                }]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userInterests = user.interests || [];
        const likedPublicationIds = (user.likedPublications || []).map((p) => p.id);
        const myPublicationIds = (await user.getPublications()).map(p => p.id);
        const excludedPublicationIds = [...new Set([...likedPublicationIds, ...myPublicationIds])];
        let recommendations = [];
        if (userInterests && userInterests.length > 0) {
            const allRelevantCategories = new Set(userInterests);
            userInterests.forEach(interest => {
                const similarCategories = (0, classificationService_1.getSimilarCategories)(interest);
                similarCategories.forEach(cat => allRelevantCategories.add(cat));
            });
            recommendations = await Publication_1.Publication.findAll({
                where: {
                    category: {
                        [sequelize_1.Op.in]: Array.from(allRelevantCategories)
                    },
                    userId: {
                        [sequelize_1.Op.ne]: userId // Exclude own publications
                    },
                    // [FIX] Exclude already liked publications
                    id: {
                        [sequelize_1.Op.notIn]: excludedPublicationIds
                    }
                },
                include: [
                    {
                        model: User_1.User,
                        as: 'author',
                        attributes: ['id', 'username', 'fullname', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: 20
            });
        }
        // Fallback for more content
        if (recommendations.length < 20) {
            const generalPublications = await Publication_1.Publication.findAll({
                where: {
                    id: {
                        [sequelize_1.Op.notIn]: [...excludedPublicationIds, ...recommendations.map(p => p.id)]
                    },
                    userId: {
                        [sequelize_1.Op.ne]: userId
                    }
                },
                include: [
                    {
                        model: User_1.User,
                        as: 'author',
                        attributes: ['id', 'username', 'fullname', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: 20 - recommendations.length
            });
            recommendations.push(...generalPublications);
        }
        const finalRecommendations = await addExtraInfoToPublications(recommendations, userId);
        // Shuffle for variety
        finalRecommendations.sort(() => Math.random() - 0.5);
        res.json(finalRecommendations);
    }
    catch (error) {
        console.error('Get recommended publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRecommendedPublications = getRecommendedPublications;
//# sourceMappingURL=publicationController.js.map
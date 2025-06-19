"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedPublications = exports.getMyLikedPublications = exports.unlikePublication = exports.likePublication = exports.getPublicationById = exports.getAllPublications = exports.createPublication = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
const Publication_1 = require("../models/Publication");
// Placeholder for AI Classification (as explained previously)
async function classifyContent(content, imageUrl) {
    // In a real application, this would involve calling an external ML service
    // or using a library like @tensorflow/tfjs-node for inference.
    if (imageUrl) {
        // Imagine calling an image classification model here
        // Example: if image recognition determines it's a "cat" or "food"
        return "Image_Content"; // Or more specific categories like "Nature", "Animals", "Art"
    }
    else {
        // Imagine calling a text classification model here
        if (content.toLowerCase().includes('news') || content.toLowerCase().includes('current events'))
            return 'News';
        if (content.toLowerCase().includes('tech') || content.toLowerCase().includes('software'))
            return 'Technology';
        if (content.toLowerCase().includes('food') || content.toLowerCase().includes('recipe'))
            return 'Food';
        if (content.toLowerCase().includes('travel') || content.toLowerCase().includes('adventure'))
            return 'Travel';
        return 'General';
    }
}
// Ensure the directory for publication images exists
const publicationImageDir = path_1.default.join(__dirname, '../../public/publications');
if (!fs_1.default.existsSync(publicationImageDir)) {
    fs_1.default.mkdirSync(publicationImageDir, { recursive: true });
}
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
        // Classify the content/image
        const category = await classifyContent(content, imageUrl);
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
        res.json(publications);
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
        res.json(publication);
    }
    catch (error) {
        console.error('Get publication by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPublicationById = getPublicationById;
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
        res.json(likedPublications);
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
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userInterests = user.interests;
        let recommendations = [];
        if (userInterests && userInterests.length > 0) {
            // Find publications matching user's interests
            recommendations = await Publication_1.Publication.findAll({
                where: {
                    category: {
                        [sequelize_1.Op.in]: userInterests
                    },
                    userId: {
                        [sequelize_1.Op.ne]: userId // Exclude own publications
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
                limit: 20 // Limit recommendations
            });
        }
        // If no specific recommendations or not enough, fill with general popular posts
        if (recommendations.length < 10) { // Ensure a minimum number of recommendations
            const generalPublications = await Publication_1.Publication.findAll({
                where: {
                    id: {
                        [sequelize_1.Op.notIn]: recommendations.map(p => p.id) // Avoid duplicates
                    },
                    userId: {
                        [sequelize_1.Op.ne]: userId // Exclude own publications
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
                limit: 10 // Add some general popular posts
            });
            recommendations = [...recommendations, ...generalPublications];
        }
        // Shuffle to provide variety
        recommendations.sort(() => Math.random() - 0.5);
        res.json(recommendations);
    }
    catch (error) {
        console.error('Get recommended publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRecommendedPublications = getRecommendedPublications;
//# sourceMappingURL=publicationController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimilarCategories = exports.classifyContent = exports.classifyImage = exports.classifyText = exports.initImageClassifier = exports.initTextClassifier = exports.PUBLICATION_CATEGORIES = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const transformers_1 = require("@xenova/transformers");
// Define available categories that publications can belong to
exports.PUBLICATION_CATEGORIES = [
    'Technology',
    'Food',
    'Travel',
    'Sports',
    'Fashion',
    'Art',
    'Music',
    'News',
    'Health',
    'Education',
    'Entertainment',
    'Business',
    'Nature',
    'Photography',
    'Lifestyle',
    'Science',
    'Gaming',
    'Fitness',
    'Animals',
    'General',
    'Politics',
    'History',
    'Finance',
    'Automotive',
    'Parenting',
    'Relationships',
    'Spirituality',
    'Environment',
    'DIY',
    'Home',
    'Gardening',
    'Movies',
    'Books',
    'Comics',
    'Memes',
    'Programming',
    'Startups',
    'Marketing',
    'Real Estate',
    'Travel Tips',
    'Events',
    'Podcasts',
    'Wellness',
    'Mental Health',
    'Personal Development',
    'Productivity',
    'Career',
    'Pets',
    'Crafts',
    'Beauty',
    'Shopping',
    'Finance',
    'Investing',
    'Crypto',
    'Astronomy',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Medicine',
    'Law',
    'Government',
    'Comics',
    'Anime',
    'Cartoons',
    'Board Games',
    'Mobile',
    'Web',
    'Cloud',
    'DevOps',
    'Data Science',
    'Machine Learning',
    'Artificial Intelligence'
];
// Cache for loaded models to avoid reloading
let textClassifier = null;
let imageClassifier = null;
/**
 * Initialize text classification model
 */
async function initTextClassifier() {
    if (!textClassifier) {
        console.log('Loading text classification model...');
        textClassifier = await (0, transformers_1.pipeline)('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli');
        console.log('Text classification model loaded');
    }
    return textClassifier;
}
exports.initTextClassifier = initTextClassifier;
/**
 * Initialize image classification model
 */
async function initImageClassifier() {
    if (!imageClassifier) {
        console.log('Loading image classification model...');
        imageClassifier = await (0, transformers_1.pipeline)('image-classification', 'Xenova/vit-base-patch16-224');
        console.log('Image classification model loaded');
    }
    return imageClassifier;
}
exports.initImageClassifier = initImageClassifier;
/**
 * Classify text content using zero-shot classification
 */
async function classifyText(text) {
    try {
        if (!text || text.trim().length === 0) {
            return 'General';
        }
        const classifier = await initTextClassifier();
        // Clean and prepare text
        const cleanText = text.trim();
        console.log('Classifying text:', cleanText.substring(0, 100) + '...');
        // Use zero-shot classification with our predefined categories
        const result = await classifier(cleanText, exports.PUBLICATION_CATEGORIES.slice());
        console.log('Classification result:', result);
        // Get the category with highest confidence
        const topCategory = result.labels[0];
        const confidence = result.scores[0];
        console.log(`Text classified as: ${topCategory} (confidence: ${confidence.toFixed(3)})`);
        // Only return the classification if confidence is reasonable
        if (confidence > 0.1) { // Lower threshold for better classification
            return topCategory;
        }
        return 'General';
    }
    catch (error) {
        console.error('Text classification error:', error);
        return 'General'; // Fallback category
    }
}
exports.classifyText = classifyText;
/**
 * Map image classification labels to our publication categories
 */
function mapImageLabelToCategory(label) {
    const labelLower = label.toLowerCase();
    // Technology related
    if (labelLower.includes('laptop') || labelLower.includes('computer') ||
        labelLower.includes('phone') || labelLower.includes('screen') ||
        labelLower.includes('keyboard') || labelLower.includes('mouse')) {
        return 'Technology';
    }
    // Food related
    if (labelLower.includes('food') || labelLower.includes('pizza') ||
        labelLower.includes('burger') || labelLower.includes('cake') ||
        labelLower.includes('fruit') || labelLower.includes('vegetable') ||
        labelLower.includes('drink') || labelLower.includes('coffee') ||
        labelLower.includes('wine') || labelLower.includes('bread')) {
        return 'Food';
    }
    // Travel related
    if (labelLower.includes('beach') || labelLower.includes('mountain') ||
        labelLower.includes('building') || labelLower.includes('monument') ||
        labelLower.includes('hotel') || labelLower.includes('plane') ||
        labelLower.includes('car') || labelLower.includes('train') ||
        labelLower.includes('boat') || labelLower.includes('bridge')) {
        return 'Travel';
    }
    // Sports related
    if (labelLower.includes('ball') || labelLower.includes('sport') ||
        labelLower.includes('stadium') || labelLower.includes('gym') ||
        labelLower.includes('bicycle') || labelLower.includes('skateboard')) {
        return 'Sports';
    }
    // Fashion related
    if (labelLower.includes('dress') || labelLower.includes('shirt') ||
        labelLower.includes('shoe') || labelLower.includes('bag') ||
        labelLower.includes('hat') || labelLower.includes('glasses') ||
        labelLower.includes('jewelry') || labelLower.includes('watch')) {
        return 'Fashion';
    }
    // Animals
    if (labelLower.includes('dog') || labelLower.includes('cat') ||
        labelLower.includes('bird') || labelLower.includes('horse') ||
        labelLower.includes('fish') || labelLower.includes('animal') ||
        labelLower.includes('pet') || labelLower.includes('wildlife')) {
        return 'Animals';
    }
    // Nature
    if (labelLower.includes('tree') || labelLower.includes('flower') ||
        labelLower.includes('plant') || labelLower.includes('garden') ||
        labelLower.includes('forest') || labelLower.includes('sky') ||
        labelLower.includes('sunset') || labelLower.includes('landscape')) {
        return 'Nature';
    }
    // Art/Photography
    if (labelLower.includes('painting') || labelLower.includes('sculpture') ||
        labelLower.includes('camera') || labelLower.includes('photo') ||
        labelLower.includes('art') || labelLower.includes('museum')) {
        return labelLower.includes('camera') || labelLower.includes('photo') ? 'Photography' : 'Art';
    }
    // Music
    if (labelLower.includes('guitar') || labelLower.includes('piano') ||
        labelLower.includes('microphone') || labelLower.includes('speaker') ||
        labelLower.includes('headphones') || labelLower.includes('instrument')) {
        return 'Music';
    }
    // Health/Fitness
    if (labelLower.includes('exercise') || labelLower.includes('yoga') ||
        labelLower.includes('gym') || labelLower.includes('medicine') ||
        labelLower.includes('hospital') || labelLower.includes('doctor')) {
        return 'Fitness';
    }
    // Default to General for unrecognized labels
    return 'General';
}
/**
 * Classify image content
 */
async function classifyImage(imagePath) {
    try {
        if (!imagePath) {
            return 'General';
        }
        const classifier = await initImageClassifier();
        console.log('Classifying image:', imagePath);
        // For file path, we need to handle it properly
        const fullImagePath = imagePath.startsWith('/') ?
            path_1.default.join(process.cwd(), 'public', imagePath) :
            imagePath;
        console.log('Full image path:', fullImagePath);
        // Check if file exists
        if (!fs_1.default.existsSync(fullImagePath)) {
            console.error('Image file not found:', fullImagePath);
            return 'General';
        }
        // Classify the image
        const result = await classifier(fullImagePath);
        console.log('Image classification result:', result);
        // Get the top prediction
        const topPrediction = Array.isArray(result) ? result[0] : result;
        const category = mapImageLabelToCategory(topPrediction.label);
        console.log(`Image classified as: ${category} (from label: ${topPrediction.label}, confidence: ${topPrediction.score.toFixed(3)})`);
        // Only return specific category if confidence is reasonable
        if (topPrediction.score > 0.1) {
            return category;
        }
        return 'General';
    }
    catch (error) {
        console.error('Image classification error:', error);
        return 'General'; // Fallback category
    }
}
exports.classifyImage = classifyImage;
/**
 * Main classification function that handles both text and image content
 */
async function classifyContent(content, imageUrl) {
    try {
        // If we have both content and image, classify both and use the more confident one
        if (content && imageUrl) {
            const [textCategory, imageCategory] = await Promise.all([
                classifyText(content),
                classifyImage(imageUrl)
            ]);
            // For simplicity, prioritize image classification if available
            // You could implement more sophisticated logic here
            return imageCategory !== 'General' ? imageCategory : textCategory;
        }
        // If only image is available
        if (imageUrl) {
            return await classifyImage(imageUrl);
        }
        // If only text is available
        if (content) {
            return await classifyText(content);
        }
        // Fallback if neither content nor image is provided
        return 'General';
    }
    catch (error) {
        console.error('Content classification error:', error);
        return 'General';
    }
}
exports.classifyContent = classifyContent;
/**
 * Get similar categories for recommendations
 * This function returns categories that are similar to the given category
 */
function getSimilarCategories(category) {
    const similarityMap = {
        'Technology': ['Science', 'Programming', 'Artificial Intelligence', 'Business', 'Startups', 'Web', 'Cloud'],
        'Food': ['Health', 'Lifestyle', 'Travel', 'Wellness'],
        'Travel': ['Photography', 'Nature', 'Travel Tips', 'Events', 'Lifestyle'],
        'Sports': ['Fitness', 'Health', 'Entertainment', 'Events', 'Lifestyle'],
        'Fashion': ['Lifestyle', 'Art', 'Beauty', 'Shopping', 'Photography'],
        'Art': ['Photography', 'Fashion', 'Entertainment', 'Comics', 'Movies'],
        'Music': ['Entertainment', 'Art', 'Lifestyle', 'Podcasts'],
        'News': ['Business', 'Politics', 'General', 'Events'],
        'Health': ['Fitness', 'Food', 'Lifestyle', 'Wellness', 'Mental Health'],
        'Education': ['Science', 'Technology', 'Business', 'Mathematics', 'Personal Development'],
        'Entertainment': ['Music', 'Gaming', 'Art', 'Movies', 'Podcasts'],
        'Business': ['Technology', 'News', 'Education', 'Finance', 'Marketing', 'Startups'],
        'Nature': ['Photography', 'Travel', 'Animals', 'Environment', 'Gardening'],
        'Photography': ['Art', 'Travel', 'Nature', 'Lifestyle', 'Animals'],
        'Lifestyle': ['Fashion', 'Food', 'Health', 'Personal Development', 'Shopping'],
        'Science': ['Technology', 'Education', 'Health', 'Mathematics', 'Physics', 'Biology'],
        'Gaming': ['Technology', 'Entertainment', 'Art', 'Board Games', 'Mobile'],
        'Fitness': ['Health', 'Sports', 'Lifestyle', 'Wellness', 'Personal Development'],
        'Animals': ['Nature', 'Photography', 'General', 'Pets'],
        'General': ['Lifestyle', 'Entertainment', 'Photography', 'News'],
        'Politics': ['News', 'Government', 'History', 'Law'],
        'History': ['Politics', 'Education', 'Books', 'Law'],
        'Finance': ['Business', 'Investing', 'Crypto', 'Real Estate'],
        'Automotive': ['Technology', 'Travel', 'Sports'],
        'Parenting': ['Relationships', 'Education', 'Lifestyle'],
        'Relationships': ['Parenting', 'Lifestyle', 'Personal Development'],
        'Spirituality': ['Personal Development', 'Wellness', 'Mental Health'],
        'Environment': ['Nature', 'Gardening', 'Science'],
        'DIY': ['Home', 'Crafts', 'Gardening'],
        'Home': ['DIY', 'Gardening', 'Lifestyle'],
        'Gardening': ['Nature', 'Home', 'DIY'],
        'Movies': ['Entertainment', 'Art', 'Books'],
        'Books': ['Education', 'Movies', 'Comics'],
        'Comics': ['Art', 'Books', 'Anime', 'Cartoons'],
        'Memes': ['Entertainment', 'Comics', 'Cartoons'],
        'Programming': ['Technology', 'Data Science', 'Machine Learning'],
        'Startups': ['Business', 'Technology', 'Marketing'],
        'Marketing': ['Business', 'Startups', 'Productivity'],
        'Real Estate': ['Finance', 'Business', 'Home'],
        'Travel Tips': ['Travel', 'Events', 'Lifestyle'],
        'Events': ['Entertainment', 'Travel', 'Sports'],
        'Podcasts': ['Music', 'Entertainment', 'Personal Development'],
        'Wellness': ['Health', 'Fitness', 'Mental Health'],
        'Mental Health': ['Wellness', 'Health', 'Personal Development'],
        'Personal Development': ['Education', 'Wellness', 'Productivity'],
        'Productivity': ['Personal Development', 'Career', 'Education'],
        'Career': ['Productivity', 'Education', 'Business'],
        'Pets': ['Animals', 'Lifestyle', 'Health'],
        'Crafts': ['DIY', 'Art', 'Home'],
        'Beauty': ['Fashion', 'Lifestyle', 'Shopping'],
        'Shopping': ['Fashion', 'Beauty', 'Lifestyle'],
        'Investing': ['Finance', 'Business', 'Crypto'],
        'Crypto': ['Finance', 'Investing', 'Technology'],
        'Astronomy': ['Science', 'Physics', 'Mathematics'],
        'Mathematics': ['Science', 'Education', 'Physics'],
        'Physics': ['Science', 'Mathematics', 'Astronomy'],
        'Chemistry': ['Science', 'Biology', 'Medicine'],
        'Biology': ['Science', 'Medicine', 'Chemistry'],
        'Medicine': ['Health', 'Biology', 'Science'],
        'Law': ['Politics', 'Government', 'History'],
        'Government': ['Politics', 'Law', 'History'],
        'Anime': ['Comics', 'Cartoons', 'Art'],
        'Cartoons': ['Comics', 'Anime', 'Memes'],
        'Board Games': ['Gaming', 'Entertainment', 'Comics'],
        'Mobile': ['Technology', 'Gaming', 'Web'],
        'Web': ['Technology', 'Programming', 'Cloud'],
        'Cloud': ['Technology', 'Web', 'DevOps'],
        'DevOps': ['Cloud', 'Technology', 'Programming'],
        'Data Science': ['Programming', 'Machine Learning', 'Artificial Intelligence'],
        'Machine Learning': ['Artificial Intelligence', 'Data Science', 'Programming'],
        'Artificial Intelligence': ['Machine Learning', 'Technology', 'Data Science'],
    };
    return similarityMap[category] || ['General'];
}
exports.getSimilarCategories = getSimilarCategories;
//# sourceMappingURL=classificationService.js.map
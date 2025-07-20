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
    'Photorealistic',
    'Cyberpunk',
    'Fantasy',
    'Sci-Fi',
    'Anime',
    'Classical Art',
    'Impressionism',
    'Abstract',
    'Surrealism',
    'Pop Art',
    'Minimalist',
    'Steampunk',
    'Gothic',
    'Vaporwave',
    'Vintage',
    'General'
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
    // Photorealistic
    if (labelLower.includes('realistic') || labelLower.includes('photo') || labelLower.includes('photograph')) {
        return 'Photorealistic';
    }
    // Cyberpunk
    if (labelLower.includes('cyberpunk') || labelLower.includes('neon') || labelLower.includes('futuristic city')) {
        return 'Cyberpunk';
    }
    // Fantasy
    if (labelLower.includes('fantasy') || labelLower.includes('dragon') || labelLower.includes('magic') || labelLower.includes('elf')) {
        return 'Fantasy';
    }
    // Sci-Fi
    if (labelLower.includes('sci-fi') || labelLower.includes('spaceship') || labelLower.includes('robot') || labelLower.includes('alien')) {
        return 'Sci-Fi';
    }
    // Anime
    if (labelLower.includes('anime') || labelLower.includes('manga') || labelLower.includes('cartoon')) {
        return 'Anime';
    }
    // Classical Art
    if (labelLower.includes('classical') || labelLower.includes('renaissance') || labelLower.includes('baroque') || labelLower.includes('oil painting')) {
        return 'Classical Art';
    }
    // Impressionism
    if (labelLower.includes('impressionism') || labelLower.includes('monet') || labelLower.includes('brushstroke')) {
        return 'Impressionism';
    }
    // Abstract
    if (labelLower.includes('abstract') || labelLower.includes('geometric') || labelLower.includes('nonrepresentational')) {
        return 'Abstract';
    }
    // Surrealism
    if (labelLower.includes('surrealism') || labelLower.includes('dreamlike') || labelLower.includes('dali')) {
        return 'Surrealism';
    }
    // Pop Art
    if (labelLower.includes('pop art') || labelLower.includes('warhol') || labelLower.includes('comic style')) {
        return 'Pop Art';
    }
    // Minimalist
    if (labelLower.includes('minimalist') || labelLower.includes('simple') || labelLower.includes('clean')) {
        return 'Minimalist';
    }
    // Steampunk
    if (labelLower.includes('steampunk') || labelLower.includes('gears') || labelLower.includes('victorian')) {
        return 'Steampunk';
    }
    // Gothic
    if (labelLower.includes('gothic') || labelLower.includes('dark') || labelLower.includes('cathedral')) {
        return 'Gothic';
    }
    // Vaporwave
    if (labelLower.includes('vaporwave') || labelLower.includes('retro') || labelLower.includes('80s') || labelLower.includes('synthwave')) {
        return 'Vaporwave';
    }
    // Vintage
    if (labelLower.includes('vintage') || labelLower.includes('old-fashioned') || labelLower.includes('retro')) {
        return 'Vintage';
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
        'Photorealistic': ['General', 'Vintage', 'Classical Art'],
        'Cyberpunk': ['Sci-Fi', 'Vaporwave', 'Steampunk', 'General'],
        'Fantasy': ['Sci-Fi', 'Surrealism', 'Anime', 'General'],
        'Sci-Fi': ['Cyberpunk', 'Fantasy', 'Steampunk', 'General'],
        'Anime': ['Pop Art', 'Fantasy', 'Surrealism', 'General'],
        'Classical Art': ['Impressionism', 'Vintage', 'Photorealistic', 'General'],
        'Impressionism': ['Classical Art', 'Abstract', 'Surrealism', 'General'],
        'Abstract': ['Surrealism', 'Impressionism', 'Minimalist', 'General'],
        'Surrealism': ['Abstract', 'Fantasy', 'Anime', 'General'],
        'Pop Art': ['Anime', 'Vaporwave', 'Minimalist', 'General'],
        'Minimalist': ['Abstract', 'Pop Art', 'General'],
        'Steampunk': ['Cyberpunk', 'Sci-Fi', 'Gothic', 'General'],
        'Gothic': ['Steampunk', 'Vintage', 'General'],
        'Vaporwave': ['Pop Art', 'Cyberpunk', 'Vintage', 'General'],
        'Vintage': ['Classical Art', 'Photorealistic', 'Vaporwave', 'General'],
        'General': ['Photorealistic', 'Classical Art', 'Anime', 'Fantasy'],
    };
    return similarityMap[category] || ['General'];
}
exports.getSimilarCategories = getSimilarCategories;
//# sourceMappingURL=classificationService.js.map
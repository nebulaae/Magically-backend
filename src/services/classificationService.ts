import fs from 'fs';
import path from 'path';

import { pipeline } from '@xenova/transformers';

// Define available categories that publications can belong to
export const PUBLICATION_CATEGORIES = [
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
] as const;

export type PublicationCategory = typeof PUBLICATION_CATEGORIES[number];

// Cache for loaded models to avoid reloading
let textClassifier: any = null;
let imageClassifier: any = null;

/**
 * Initialize text classification model
 */
export async function initTextClassifier(): Promise<any> {
    if (!textClassifier) {
        console.log('Loading text classification model...');
        textClassifier = await pipeline(
            'zero-shot-classification',
            'Xenova/distilbert-base-uncased-mnli'
        );
        console.log('Text classification model loaded');
    }
    return textClassifier;
}

/**
 * Initialize image classification model
 */
export async function initImageClassifier(): Promise<any> {
    if (!imageClassifier) {
        console.log('Loading image classification model...');
        imageClassifier = await pipeline(
            'image-classification',
            'Xenova/vit-base-patch16-224'
        );
        console.log('Image classification model loaded');
    }
    return imageClassifier;
}

/**
 * Classify text content using zero-shot classification
 */
export async function classifyText(text: string): Promise<PublicationCategory> {
    try {
        if (!text || text.trim().length === 0) {
            return 'General';
        }

        const classifier = await initTextClassifier();

        // Clean and prepare text
        const cleanText = text.trim();
        console.log('Classifying text:', cleanText.substring(0, 100) + '...');

        // Use zero-shot classification with our predefined categories
        const result = await classifier(cleanText, PUBLICATION_CATEGORIES.slice());

        console.log('Classification result:', result);

        // Get the category with highest confidence
        const topCategory = result.labels[0] as PublicationCategory;
        const confidence = result.scores[0];

        console.log(`Text classified as: ${topCategory} (confidence: ${confidence.toFixed(3)})`);

        // Only return the classification if confidence is reasonable
        if (confidence > 0.1) { // Lower threshold for better classification
            return topCategory;
        }

        return 'General';
    } catch (error) {
        console.error('Text classification error:', error);
        return 'General'; // Fallback category
    }
}

/**
 * Map image classification labels to our publication categories
 */
function mapImageLabelToCategory(label: string): PublicationCategory {
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
export async function classifyImage(imagePath: string): Promise<PublicationCategory> {
    try {
        if (!imagePath) {
            return 'General';
        }

        const classifier = await initImageClassifier();

        console.log('Classifying image:', imagePath);

        // For file path, we need to handle it properly
        const fullImagePath = imagePath.startsWith('/') ?
            path.join(process.cwd(), 'public', imagePath) :
            imagePath;

        console.log('Full image path:', fullImagePath);

        // Check if file exists
        if (!fs.existsSync(fullImagePath)) {
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
    } catch (error) {
        console.error('Image classification error:', error);
        return 'General'; // Fallback category
    }
}

/**
 * Main classification function that handles both text and image content
 */
export async function classifyContent(content?: string, imageUrl?: string): Promise<PublicationCategory> {
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
    } catch (error) {
        console.error('Content classification error:', error);
        return 'General';
    }
}

/**
 * Get similar categories for recommendations
 * This function returns categories that are similar to the given category
 */
export function getSimilarCategories(category: PublicationCategory): PublicationCategory[] {
    const similarityMap: Record<PublicationCategory, PublicationCategory[]> = {
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
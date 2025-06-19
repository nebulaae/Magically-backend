import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';

// Define available categories that publications can belong to
export const PUBLICATION_CATEGORIES = [
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
    'General'
] as const;

export type PublicationCategory = typeof PUBLICATION_CATEGORIES[number];

// Cache for loaded models to avoid reloading
let textClassifier: any = null;
let imageClassifier: any = null;

/**
 * Initialize text classification model
 */
async function initTextClassifier(): Promise<any> {
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
async function initImageClassifier(): Promise<any> {
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
 * Test function to debug classification
 * You can call this function to test if classification is working
 */
export async function testClassification() {
    console.log('=== Testing Classification Service ===');

    // Test text classification
    const testTexts = [
        "I love this new iPhone, it's amazing technology!",
        "Just made delicious pasta with tomatoes and basil",
        "Beautiful sunset at the beach during my vacation",
        "Great workout at the gym today, feeling strong!",
        "This painting is absolutely stunning, pure art"
    ];

    console.log('Testing text classification:');
    for (const text of testTexts) {
        try {
            const category = await classifyText(text);
            console.log(`"${text}" -> ${category}`);
        } catch (error) {
            console.error(`Error classifying "${text}":`, error);
        }
    }

    console.log('=== Classification Test Complete ===');
}

/**
 * Get similar categories for recommendations
 * This function returns categories that are similar to the given category
 */
export function getSimilarCategories(category: PublicationCategory): PublicationCategory[] {
    const similarityMap: Record<PublicationCategory, PublicationCategory[]> = {
        'Technology': ['Science', 'Gaming', 'Business'],
        'Food': ['Health', 'Lifestyle', 'Travel'],
        'Travel': ['Photography', 'Nature', 'Lifestyle'],
        'Sports': ['Fitness', 'Health', 'Entertainment'],
        'Fashion': ['Lifestyle', 'Art', 'Photography'],
        'Art': ['Photography', 'Fashion', 'Entertainment'],
        'Music': ['Entertainment', 'Art', 'Lifestyle'],
        'News': ['Business', 'Education', 'General'],
        'Health': ['Fitness', 'Food', 'Lifestyle'],
        'Education': ['Science', 'Technology', 'Business'],
        'Entertainment': ['Music', 'Gaming', 'Art'],
        'Business': ['Technology', 'News', 'Education'],
        'Nature': ['Photography', 'Travel', 'Animals'],
        'Photography': ['Art', 'Travel', 'Nature'],
        'Lifestyle': ['Fashion', 'Food', 'Health'],
        'Science': ['Technology', 'Education', 'Health'],
        'Gaming': ['Technology', 'Entertainment', 'Art'],
        'Fitness': ['Health', 'Sports', 'Lifestyle'],
        'Animals': ['Nature', 'Photography', 'General'],
        'General': ['Lifestyle', 'Entertainment', 'Photography']
    };

    return similarityMap[category] || ['General'];
}
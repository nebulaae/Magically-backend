import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = 'https://api.kling.ai/v1/images/generations'; // Example URL, replace with actual

/**
 * A system prompt to guide the AI model.
 */
const SYSTEM_PROMPT = "Generate a highly detailed and artistic image in the specified style. The user's face from the uploaded image should be realistically integrated into the generated scene.";

export interface GenerationResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

/**
 * Calls the AI generation API to transform a user's image.
 * @param imageBuffer - The buffer of the user's uploaded image.
 * @param prompt - The user's description/prompt.
 * @param style - The artistic style for the generation.
 * @returns The URL of the generated image or an error message.
 */
export const generateImage = async (
    imageBuffer: Buffer,
    prompt: string,
    style: string
): Promise<GenerationResult> => {
    if (!AI_API_KEY) {
        console.error('AI API Key is not configured.');
        return { success: false, error: 'AI service is not configured.' };
    }

    try {
        // This is a conceptual example. You will need to adapt this to the specific
        // API requirements of Kling, Higgsfield, or Midjourney.
        // Many services may require a multi-step process: upload image, get an ID, then poll for results.
        const formData = new FormData();
        formData.append('image', new Blob([imageBuffer]));
        formData.append('prompt', `${SYSTEM_PROMPT} Style: ${style}. Prompt: ${prompt}`);

        const response = await axios.post(AI_API_URL, formData, {
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        // Assuming the API returns the URL of the generated image directly
        const generatedImageUrl = response.data.imageUrl;

        if (!generatedImageUrl) {
            return { success: false, error: 'Failed to retrieve generated image from AI service.' };
        }

        return { success: true, imageUrl: generatedImageUrl };

    } catch (error) {
        console.error('Error calling AI Generation Service:', error);
        return { success: false, error: 'An error occurred during AI image generation.' };
    }
};
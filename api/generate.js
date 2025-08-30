import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(path.dirname(__dirname), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key] = value;
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { location, atmosphere, focus, detail, feelings } = req.body;
    const prompt = constructArtisticPrompt({ location, atmosphere, focus, detail, feelings });
    console.log('Generated prompt:', prompt);
    const imageUrl = await generateImage(prompt);
    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('=== HANDLER ERROR ===');
    console.error('Error in handler function:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END HANDLER ERROR ===');
    return res.status(500).json({ 
      message: 'Unable to create your Omoide. Please try again.',
      error: error.message // Include actual error in response for debugging
    });
  }
}

function constructArtisticPrompt({ location, atmosphere, focus, detail, feelings }) {
  const atmosphereMap = {
    'sunny': 'bathed in brilliant sunlight with crisp shadows',
    'golden': 'illuminated by warm, golden hour light',
    'overcast': 'under moody, overcast skies with soft, diffused light',
    'rainy': 'veiled in gentle rain and mist',
    'night': 'under a deep blue, starry night sky'
  };
  const feelingPhrase = feelings.join(' and ');
  return `Ukiyo-e woodblock print in the style of Hiroshige, a personal memory of ${location}, Japan. The scene is ${atmosphereMap[atmosphere] || atmosphere}, focusing on ${focus}. A key detail is ${detail}. The entire image evokes a feeling of ${feelingPhrase}, rendered with masterful use of negative space and a poetic, timeless quality.`;
}

async function generateImage(prompt) {
  try {
    console.log('Using Gemini API with Imagen 4.0 Ultra...');
    
    const ai = new GoogleGenAI({
      apiKey: envVars.GEMINI_API_KEY
    });

    console.log('Sending request to Imagen 4.0 Ultra via Gemini API...');
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-ultra-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });

    console.log('Response received from Gemini API');

    if (response.generatedImages && response.generatedImages.length > 0) {
      const generatedImage = response.generatedImages[0];
      
      if (generatedImage.image && generatedImage.image.imageBytes) {
        const imgBytes = generatedImage.image.imageBytes;
        console.log('Image data found, length:', imgBytes.length);
        
        // Return in the same format as before
        return `data:image/png;base64,${imgBytes}`;
      }
    }
    
    throw new Error('No image data was returned from the Gemini API.');

  } catch (error) {
    console.error('=== GEMINI API ERROR DETAILS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR DETAILS ===');
    
    throw new Error(`Gemini API Error: ${error.code || 'UNKNOWN'} - ${error.message || 'No message'}`);
  }
}
import { VertexAI } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.error('Error in handler function:', error);
    return res.status(500).json({ message: 'Unable to create your Omoide. Please try again.' });
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
  const projectId = process.env.GOOGLE_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('Google Cloud project ID is not set in environment variables.');
  }

  try {
    // Use credentials from environment variable or local file
    let credentials;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      // Production/Vercel: parse JSON credentials from environment
      credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } else {
      // Local development: read from file
      const credentialsPath = path.join(__dirname, 'service-account.json');
      credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    }
    
    const auth = new GoogleAuth({ 
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const vertexAI = new VertexAI({
      project: projectId,
      location: 'us-west1',
      googleAuthOptions: { credentials }
    });

    const generativeModel = vertexAI.getGenerativeModel({ model: 'imagen-3.0-generate-001' });
    const request = { contents: [{ parts: [{ text: prompt }] }] };

    const response = await generativeModel.generateContent(request);

    console.log('Full API response structure:', JSON.stringify(response, null, 2));
    console.log('Response keys:', Object.keys(response));
    
    if (response.response) {
      console.log('Response.response keys:', Object.keys(response.response));
      if (response.response.candidates) {
        console.log('Number of candidates:', response.response.candidates.length);
        console.log('First candidate structure:', JSON.stringify(response.response.candidates[0], null, 2));
      }
    }

    const base64Image = response.response.candidates[0].content.parts[0].inlineData.data;

    if (base64Image) {
      console.log('Image data found, length:', base64Image.length);
      return `data:image/png;base64,${base64Image}`;
    } else {
      throw new Error('No image data was returned from the API.');
    }

  } catch (error) {
    console.error('Vertex AI API error:', error);
    throw new Error('Failed to generate image with Vertex AI.');
  }
}
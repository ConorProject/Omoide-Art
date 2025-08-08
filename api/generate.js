import { VertexAI } from '@google-cloud/vertexai';

// This is your handler function. It receives the request from the website.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { location, atmosphere, focus, detail, feelings } = req.body;
    
    // Construct the artistic prompt
    const prompt = constructArtisticPrompt({ location, atmosphere, focus, detail, feelings });
    console.log('Generated prompt:', prompt);

    // Call the function to generate the image
    const imageUrl = await generateImage(prompt);
    
    // Send the final image URL back to the website
    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error('Error in handler function:', error);
    return res.status(500).json({ message: 'Unable to create your Omoide. Please try again.' });
  }
}

// This function builds your "secret sauce" prompt
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

// This function connects to Google AI using your secure credentials
async function generateImage(prompt) {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!encodedCredentials || !projectId) {
        throw new Error('Google Cloud credentials are not configured in Vercel environment variables.');
    }

    try {
        // "Unwrap the bubble wrap" - Decode the Base64 credential
        const decodedCredsString = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
        const credentials = JSON.parse(decodedCredsString);

        // Initialize the AI client using the decoded credentials
        const vertexAI = new VertexAI({
            project: projectId,
            location: 'us-central1',
            credentials: credentials 
        });

        const generativeModel = vertexAI.getGenerativeModel({ model: 'imagegeneration@005' });
        
        const request = { contents: [{ parts: [{ text: prompt }] }] };
        
        const response = await generativeModel.generateContent({
            ...request,
            generationConfig: { "number_of_images": 1 },
        });

        const base64Image = response.response.candidates[0].content.parts[0].inlineData.data;

        if (base64Image) {
            return `data:image/png;base64,${base64Image}`;
        } else {
            throw new Error('No image data was returned from the API.');
        }

    } catch (error) {
        console.error('Vertex AI API error:', error);
        throw new Error('Failed to generate image with Vertex AI.');
    }
}
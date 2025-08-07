/**
 * Omoide Art - Image Generation Serverless Function
 * 
 * This Vercel serverless function receives memory details from the frontend,
 * constructs an artistic prompt, and generates a Ukiyo-e style image using
 * Google Vertex AI (Imagen).
 */

// Using REST API instead of SDK for cleaner API key authentication

/**
 * Main handler for the serverless function
 * @param {Request} req - The incoming request
 * @param {Response} res - The response object
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests' 
    });
  }

  try {
    // Parse and validate the request body
    const { location, atmosphere, focus, detail, feelings } = req.body;

    // Validate required fields
    if (!location || !atmosphere || !focus || !detail || !feelings) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide location, atmosphere, focus, detail, and feelings'
      });
    }

    // Validate feelings is an array
    if (!Array.isArray(feelings) || feelings.length === 0) {
      return res.status(400).json({
        error: 'Invalid feelings format',
        message: 'Feelings must be a non-empty array'
      });
    }

    // Construct the artistic prompt - this is the "secret sauce"
    const prompt = constructArtisticPrompt({
      location,
      atmosphere,
      focus,
      detail,
      feelings
    });

    console.log('Generated prompt:', prompt);

    // Generate the image using Vertex AI
    const imageUrl = await generateImage(prompt);

    // Return the successful response
    return res.status(200).json({
      imageUrl,
      message: 'Your Omoide has been created successfully'
    });

  } catch (error) {
    console.error('Error in generate function:', error);
    
    // Determine appropriate error response
    if (error.message.includes('API key')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Server configuration issue. Please contact support.'
      });
    }
    
    return res.status(500).json({
      error: 'Generation failed',
      message: 'Unable to create your Omoide. Please try again.'
    });
  }
}

/**
 * Constructs the artistic prompt by weaving user inputs into a narrative
 * @param {Object} inputs - User's memory details
 * @returns {string} - The constructed prompt
 */
function constructArtisticPrompt({ location, atmosphere, focus, detail, feelings }) {
  // Map atmosphere values to more descriptive artistic terms
  const atmosphereMap = {
    'sunny': 'bathed in brilliant sunlight with crisp shadows and vibrant clarity',
    'golden': 'illuminated by the warm, honey-colored light of the golden hour',
    'overcast': 'shrouded in moody, overcast skies with soft, diffused light',
    'rainy': 'veiled in gentle rain and mist, creating ethereal atmosphere',
    'night': 'embraced by the deep blues and blacks of night, with subtle moonlight'
  };

  // Map feelings to artistic mood descriptors
  const feelingDescriptors = {
    'peaceful': 'serene tranquility',
    'awe': 'breathtaking majesty',
    'energetic': 'dynamic vitality',
    'romantic': 'tender intimacy',
    'nostalgic': 'wistful remembrance',
    'melancholy': 'poignant beauty'
  };

  // Convert feelings array to descriptive phrase
  const feelingPhrase = feelings
    .map(f => feelingDescriptors[f.toLowerCase()] || f)
    .join(' and ');

  // Construct the base prompt with artistic direction
  const basePrompt = `Ukiyo-e woodblock print in the refined and atmospheric style of Hiroshige, capturing a personal memory of ${location} in Japan. `;

  // Weave the narrative
  const narrativePrompt = `The scene is ${atmosphereMap[atmosphere] || atmosphere}, focusing on ${focus} as the central element that draws the viewer's eye. A distinctive detail enhances the composition: ${detail}. The entire image evokes a feeling of ${feelingPhrase}, rendered with the characteristic flat color planes, bold outlines, and masterful use of negative space found in classical Japanese woodblock prints. The color palette should be both authentic to Ukiyo-e tradition and emotionally resonant with the memory's mood.`;

  // Additional artistic instructions
  const technicalPrompt = ` Compositional style: asymmetric balance with dramatic perspective, subtle gradients in the sky, and the poetic simplicity that makes Japanese prints timeless. High quality, museum-worthy artwork.`;

  return basePrompt + narrativePrompt + technicalPrompt;
}

/**
 * Calls the Google Vertex AI API to generate an image
 * @param {string} prompt - The artistic prompt
 * @returns {Promise<string>} - URL of the generated image
 */
/**
 * Calls the Google Vertex AI API to generate an image using a Service Account
 * @param {string} prompt - The artistic prompt
 * @returns {Promise<string>} - A Data URL of the generated image
 */
async function generateImage(prompt) {
    // These credentials are now read from the .env.local file automatically by the library
    const projectId = process.env.GOOGLE_PROJECT_ID;

    // A quick check to make sure the environment variables are loaded.
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || !projectId) {
        throw new Error('Google Cloud credentials are not set correctly in the .env.local file.');
    }

    try {
        // Initialize Vertex AI client. 
        // By setting up the GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable,
        // the client will automatically handle the authentication. We don't need to pass an API key.
        const vertexAI = new VertexAI({
            project: projectId,
            location: 'us-central1'
        });

        // Get the image generation model
        const generativeModel = vertexAI.getGenerativeModel({
            model: 'imagegeneration@005', // A recent, stable Imagen model
        });
        
        const request = {
            contents: [{
                parts: [{ text: prompt }]
            }],
        };
        
        // Generate the content (the image)
        const response = await generativeModel.generateContent({
            ...request,
            generationConfig: {
                "number_of_images": 1
            },
        });

        // Extract the Base64 image data from the response
        const base64Image = response.response.candidates[0].content.parts[0].inlineData.data;

        if (base64Image) {
            // Return the image as a Data URL that the browser can display
            const imageUrl = `data:image/png;base64,${base64Image}`;
            return imageUrl;
        } else {
            throw new Error('No image data was returned from the API.');
        }

    } catch (error) {
        console.error('Vertex AI API error:', error);
        throw new Error('Failed to generate image with Vertex AI. Check your credentials and API permissions.');
    }
}
/**
 * CORS headers configuration for Vercel
 * Add this to your vercel.json if needed:
 * {
 *   "headers": [
 *     {
 *       "source": "/api/generate",
 *       "headers": [
 *         { "key": "Access-Control-Allow-Origin", "value": "*" },
 *         { "key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
 *         { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
 *       ]
 *     }
 *   ]
 * }
 */
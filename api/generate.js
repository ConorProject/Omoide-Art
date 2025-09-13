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

async function enhancePromptWithAI({ location, focus, detail, atmosphere, feelings }) {
  try {
    console.log('Enhancing user inputs with Gemini API...');
    
    const atmosphereMap = {
      'sunny': 'under brilliant clear skies with crisp shadows and warm sunlight filtering through',
      'golden': 'bathed in warm golden hour light with soft atmospheric glow',
      'overcast': 'beneath softly overcast skies with gentle, diffused lighting',
      'rainy': 'swept by gentle rain with reflections glistening on wet surfaces',
      'night': 'at twilight under deep indigo skies with soft lantern light'
    };
    
    const feelingPhrase = feelings.join(' and ');
    
    const prompt = `You are an expert in Japanese art history and an artistic director for a service called Omoide Art. Your task is to take a user's simple memory of a modern Japanese scene and rewrite it into a rich, detailed, and masterful prompt for an image generator. The final style must be "Modern Shin-hanga," in the spirit of artist Kawase Hasui.

Follow these advanced rules:
1. **Always add a strong foreground anchor.** This is crucial for depth. Suggest classic shin-hanga elements like a windswept pine tree, a stone lantern, the edge of a veranda, or the frame of a rain-streaked window.
2. **Describe the scene in layers.** Create a sense of atmospheric depth by describing the foreground, middle ground, and background.
3. **Weave a narrative.** Instead of just listing the user's focus, weave it into a cohesive, descriptive sentence that connects it to the location and atmosphere.
4. **Translate modern elements.** Render modern lights as 'soft blooms of color,' not sharp LEDs.
5. **Incorporate key technical terms** like 'bokashi gradations' and 'washi paper texture.'
6. **The final sentence must reinforce the style:** "...capturing the quiet beauty characteristic of the finest shin-hanga masters of the early 20th century, applied to a modern vista."

Here is the user's memory:
- Location: ${location}, Japan
- Focus: ${focus}
- Detail: ${detail}
- Atmosphere: ${atmosphereMap[atmosphere] || atmosphere}
- Mood: ${feelingPhrase}

Based on this, please generate the complete, final prompt for the image generator. Return ONLY the final prompt.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + envVars.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const result = await response.json();
    const enhancedPrompt = result.candidates[0].content.parts[0].text.trim();
    
    return { enhancedPrompt };
  } catch (error) {
    console.log('AI enhancement failed, using fallback method:', error.message);
    return { enhancedPrompt: null };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { location, atmosphere, focus, detail, feelings } = req.body;
    
    // Enhance user inputs with AI preprocessing to create complete artistic prompt
    const { enhancedPrompt } = await enhancePromptWithAI({ location, focus, detail, atmosphere, feelings });
    
    if (enhancedPrompt) {
      console.log('Using AI-enhanced prompt:', enhancedPrompt);
      const imageUrl = await generateImage(enhancedPrompt);
      return res.status(200).json({ imageUrl });
    } else {
      // Fallback to original method if AI enhancement fails
      const prompt = constructArtisticPrompt({ location, atmosphere, focus, detail, feelings });
      console.log('Using fallback prompt:', prompt);
      const imageUrl = await generateImage(prompt);
      return res.status(200).json({ imageUrl });
    }
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
    'sunny': 'under brilliant clear skies with crisp shadows and warm sunlight filtering through',
    'golden': 'bathed in warm golden hour light with soft atmospheric glow',
    'overcast': 'beneath softly overcast skies with gentle, diffused lighting',
    'rainy': 'swept by gentle rain with reflections glistening on wet surfaces',
    'night': 'at twilight under deep indigo skies with soft lantern light'
  };
  
  const feelingPhrase = feelings.join(' and ');
  
  return `A delicate and precise Japanese shin-hanga woodblock print in the style of Kawase Hasui. The view from ${location}, Japan, ${atmosphereMap[atmosphere] || atmosphere}. The composition focuses sharply on ${focus}, where ${detail} creates an atmospheric focal point rendered with fine linework and layered color washes. Masterful execution featuring precise bokashi color gradations, visible washi paper texture, and subtle wood grain from the printing block. Fine architectural details, delicate brushwork textures, and soft blended shadows suggesting gentle natural light. The color palette uses traditional mineral pigments in ${feelingPhrase} harmony. Highlights achieved through strategic use of untouched paper areas. The overall composition is elegant and asymmetrical, capturing the delicate touch and quiet beauty characteristic of the finest shin-hanga masters of the early 20th century.`;
}

async function generateImage(prompt) {
  try {
    console.log('Using Wavespeed AI with Imagen 4.0 Ultra for 2K resolution...');
    
    const url = "https://api.wavespeed.ai/api/v3/google/imagen4-ultra";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${envVars.WAVESPEED_API_KEY}`
    };
    
    const payload = {
      "prompt": prompt,
      "aspect_ratio": "1:1",
      "resolution": "2k",  // This is the key for 2048x2048!
      "num_images": 1,
      "negative_prompt": "",
      "enable_base64_output": true  // Get base64 to match our current format
    };

    console.log('Submitting request to Wavespeed AI...');
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Wavespeed API Error: ${response.status} - ${await response.text()}`);
    }

    const result = await response.json();
    const requestId = result.data.id;
    console.log(`Task submitted successfully. Request ID: ${requestId}`);
    
    // Poll for completion
    while (true) {
      const statusResponse = await fetch(
        `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`, 
        { 
          headers: {
            "Authorization": `Bearer ${envVars.WAVESPEED_API_KEY}`
          } 
        }
      );
      
      const statusResult = await statusResponse.json();

      if (statusResponse.ok) {
        const data = statusResult.data;
        const status = data.status;

        if (status === "completed") {
          console.log('Image generation completed!');
          const imageData = data.outputs[0];  // Already formatted as data URL
          console.log('Image data length:', imageData ? imageData.length : 'null');
          return imageData;  // Return as-is since it's already a data URL
        } else if (status === "failed") {
          throw new Error(`Wavespeed AI task failed: ${data.error}`);
        } else {
          console.log("Task still processing. Status:", status);
        }
      } else {
        throw new Error(`Wavespeed polling error: ${statusResponse.status} - ${JSON.stringify(statusResult)}`);
      }

      // Wait 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error('=== WAVESPEED API ERROR DETAILS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR DETAILS ===');
    
    throw new Error(`Wavespeed AI Error: ${error.message || 'Unknown error'}`);
  }
}
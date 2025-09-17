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

async function enhancePromptWithAI({ location, focus, detail, atmosphere, feelings, aspectRatio, season }) {
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
    
    const prompt = `You are an expert in Japanese art history and an artistic director for a service called Omoide Art. Your task is to take a user's simple memory of a modern Japanese scene and rewrite it into a rich, detailed, and masterful prompt for an image generator. The final style must be "Traditional Japanese woodblock print in the Modern Shin-hanga style," specifically in the spirit of artist Kawase Hasui.

Follow these advanced rules:
1. **Describe the scene in layers.** Create a sense of atmospheric depth by describing the foreground, middle ground, and background, while keeping the user's specific memory as the central focus.
2. **Weave a narrative.** Instead of just listing the user's focus, weave it into a cohesive, descriptive sentence that connects it to the location and atmosphere.
3. **Translate modern elements.** Render modern lights as 'soft blooms of color,' not sharp LEDs.
4. **Emphasize woodblock print characteristics.** Use terms like "flat color planes," "stylized rather than photorealistic figures," "crisp linework," "detailed textures and surfaces," and "traditional woodblock printing techniques."
5. **Incorporate key technical terms** like 'bokashi gradations' and 'washi paper texture.'
6. **The final sentence must reinforce the style:** "...capturing the quiet beauty characteristic of the finest shin-hanga masters of the early 20th century, applied to a modern vista."
7. **CRITICAL - Start with exact phrase:** The very first words must be "Generate 4 variations depicting" followed by the scene description.
8. **Finally, append the user's chosen aspect ratio to the very end of the prompt in the format ar [value]. For example: ar 3:4.**

Here is the user's memory:
- Location: ${location}, Japan
- Season: ${season ? season.charAt(0).toUpperCase() + season.slice(1) : 'Not specified'}
- Focus: ${focus}
- Detail: ${detail}
- Atmosphere: ${atmosphereMap[atmosphere] || atmosphere}
- Mood: ${feelingPhrase}
- Aspect Ratio: ${aspectRatio}

Based on this, please generate the complete, final prompt for the image generator. Return ONLY the final prompt.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + envVars.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
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
    const { location, atmosphere, focus, detail, feelings, aspectRatio, season } = req.body;

    // Enhance user inputs with AI preprocessing to create complete artistic prompt
    const { enhancedPrompt } = await enhancePromptWithAI({ location, focus, detail, atmosphere, feelings, aspectRatio, season });
    
    if (enhancedPrompt) {
      console.log('Using AI-enhanced prompt:', enhancedPrompt);
      const jobResult = await generateImage(enhancedPrompt, aspectRatio || '1:1');
      return res.status(200).json(jobResult);
    } else {
      // Fallback to original method if AI enhancement fails
      const prompt = constructArtisticPrompt({ location, atmosphere, focus, detail, feelings });
      console.log('Using fallback prompt:', prompt);
      const jobResult = await generateImage(prompt, aspectRatio || '1:1');
      return res.status(200).json(jobResult);
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

function aspectRatioToSize(aspectRatio) {
  const sizeMap = {
    "1:1": "4096*4096",
    "3:4": "3072*4096",
    "4:3": "4096*3072"
  };
  return sizeMap[aspectRatio] || "4096*4096";
}

// Submit job and return job ID immediately - no polling
async function generateImage(prompt, aspectRatio = '1:1') {
  try {
    console.log('🚀 Submitting 4K image generation job...');

    const url = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/sequential";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${envVars.WAVESPEED_API_KEY}`
    };

    const payload = {
      "prompt": prompt,
      "size": aspectRatioToSize(aspectRatio),
      "max_images": 4,
      "enable_base64_output": false,
      "enable_sync_mode": false  // Use async mode
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }

    const jobResult = await response.json();

    if (!jobResult.data || !jobResult.data.id) {
      throw new Error('Invalid job submission response');
    }

    console.log(`✅ Job submitted successfully: ${jobResult.data.id}`);
    return {
      jobId: jobResult.data.id,
      status: 'submitted',
      message: 'Image generation started'
    };

  } catch (error) {
    console.log(`❌ Job submission failed: ${error.message}`);
    throw error;
  }
}
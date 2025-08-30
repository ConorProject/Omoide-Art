import { GoogleGenerativeAI } from '@google/generative-ai';
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

async function testGeminiNative() {
  try {
    console.log('Testing Gemini 2.5 Flash native image generation...');
    
    const genAI = new GoogleGenerativeAI(envVars.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Generate an image: Ukiyo-e woodblock print in the style of Hiroshige, a personal memory of Kyoto, Japan. The scene is illuminated by warm, golden hour light, focusing on a small temple garden. A key detail is cherry blossoms floating on a pond. The entire image evokes a feeling of peaceful and nostalgic, rendered with masterful use of negative space and a poetic, timeless quality.`;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    
    console.log('Response received!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // Check if we got image data
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      console.log('Candidate content:', candidate.content);
      
      // Look for image parts
      if (candidate.content && candidate.content.parts) {
        candidate.content.parts.forEach((part, index) => {
          console.log(`Part ${index}:`, Object.keys(part));
          if (part.inlineData) {
            console.log('Found image data!');
            console.log('MIME type:', part.inlineData.mimeType);
            console.log('Data length:', part.inlineData.data ? part.inlineData.data.length : 'No data');
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Gemini native test failed:', error.message);
    console.error('Full error:', error);
  }
}

testGeminiNative();
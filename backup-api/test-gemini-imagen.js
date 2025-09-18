import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
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

async function testGeminiImagen() {
  try {
    console.log('Testing Imagen 4.0 Ultra through Gemini API...');
    
    const ai = new GoogleGenAI({
      apiKey: envVars.GEMINI_API_KEY
    });

    const prompt = `Ukiyo-e woodblock print in the style of Hiroshige, a personal memory of Kyoto, Japan. The scene is illuminated by warm, golden hour light, focusing on a small temple garden. A key detail is cherry blossoms floating on a pond. The entire image evokes a feeling of peaceful and nostalgic, rendered with masterful use of negative space and a poetic, timeless quality.`;

    console.log('Sending request to Imagen 4.0 Ultra...');
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-ultra-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });

    console.log('Response received!');
    console.log('Number of images generated:', response.generatedImages.length);

    if (response.generatedImages && response.generatedImages.length > 0) {
      const generatedImage = response.generatedImages[0];
      console.log('Image properties:', Object.keys(generatedImage));
      
      if (generatedImage.image && generatedImage.image.imageBytes) {
        const imgBytes = generatedImage.image.imageBytes;
        const buffer = Buffer.from(imgBytes, "base64");
        
        // Save the image
        const outputPath = path.join(__dirname, 'test-omoide.png');
        fs.writeFileSync(outputPath, buffer);
        console.log('✅ Image saved successfully to:', outputPath);
        console.log('Image data length:', imgBytes.length);
        
        // Return base64 data URL format like your original API
        const dataUrl = `data:image/png;base64,${imgBytes}`;
        console.log('Generated data URL length:', dataUrl.length);
        
        return dataUrl;
      } else {
        console.log('No image data found in response');
      }
    } else {
      console.log('No images generated');
    }
    
  } catch (error) {
    console.error('Gemini Imagen test failed:', error.message);
    console.error('Full error:', error);
  }
}

testGeminiImagen();
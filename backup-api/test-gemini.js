import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGemini() {
  try {
    const credentialsPath = path.join(__dirname, 'service-account.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const auth = new GoogleAuth({ 
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const accessToken = await auth.getAccessToken();
    const projectId = credentials.project_id;
    
    console.log('Testing Gemini API for image generation...');
    
    // Using Gemini Pro Vision or similar model that can generate images
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent`;
    
    const request = {
      contents: [{
        parts: [{
          text: "Generate an image: Ukiyo-e woodblock print of a simple red circle in the style of traditional Japanese art"
        }]
      }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    console.log('Gemini API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error:', errorText);
    } else {
      console.log('✓ Gemini API accessible!');
      const data = await response.json();
      console.log('Response structure:', Object.keys(data));
    }
    
  } catch (error) {
    console.error('Gemini test failed:', error.message);
  }
}

testGemini();
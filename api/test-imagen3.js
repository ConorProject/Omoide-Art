import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImagen3() {
  try {
    const credentialsPath = path.join(__dirname, 'service-account.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const auth = new GoogleAuth({ 
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const accessToken = await auth.getAccessToken();
    const projectId = credentials.project_id;
    
    console.log('Testing Imagen 3.0 quota...');
    
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:generateContent`;
    
    const request = {
      contents: [{ 
        role: 'user',
        parts: [{ text: "A simple red circle" }] 
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

    console.log('Imagen 3.0 response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error:', errorText);
    } else {
      console.log('✓ Imagen 3.0 works! You can use this as a fallback.');
      const data = await response.json();
      console.log('Response structure:', Object.keys(data));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testImagen3();
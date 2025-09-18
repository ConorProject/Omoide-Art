import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testQuota() {
  try {
    const credentialsPath = path.join(__dirname, 'service-account.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const auth = new GoogleAuth({ 
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const accessToken = await auth.getAccessToken();
    const projectId = credentials.project_id;
    
    // Try a minimal request to check quota limits
    console.log('Testing Vertex AI quota with minimal request...');
    
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-4.0-generate-001:generateContent`;
    
    const minimalRequest = {
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
      body: JSON.stringify(minimalRequest)
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      
      // Parse the error to understand the specific issue
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          console.log('\n--- Error Details ---');
          console.log('Code:', errorData.error.code);
          console.log('Status:', errorData.error.status);
          console.log('Message:', errorData.error.message);
        }
      } catch (e) {
        console.log('Could not parse error JSON');
      }
    } else {
      console.log('✓ Request successful! Quota is available.');
    }
    
  } catch (error) {
    console.error('Quota test failed:', error.message);
  }
}

testQuota();
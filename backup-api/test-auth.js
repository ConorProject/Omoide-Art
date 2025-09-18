import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAuth() {
  try {
    console.log('Testing Google Cloud authentication...');
    
    // Load credentials
    const credentialsPath = path.join(__dirname, 'service-account.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('✓ Service account loaded');
    console.log('Project ID:', credentials.project_id);
    
    const auth = new GoogleAuth({ 
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    // Get access token
    const accessToken = await auth.getAccessToken();
    console.log('✓ Access token obtained');
    
    // Test a simple API call to check if service account works
    const projectId = credentials.project_id;
    const testEndpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1`;
    
    console.log('Testing API access...');
    const response = await fetch(testEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    console.log('API Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      console.log('✓ API access successful');
    }
    
  } catch (error) {
    console.error('Authentication test failed:', error.message);
    console.error('Full error:', error);
  }
}

testAuth();
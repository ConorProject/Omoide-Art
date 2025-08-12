import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';

async function testAuth() {
  try {
    console.log('Testing Google Cloud authentication...');
    
    // Check if service account file exists
    const credentialsPath = '/Users/Conor2/omoide-art/api/service-account.json';
    if (!fs.existsSync(credentialsPath)) {
      throw new Error('Service account file not found');
    }
    
    // Read and parse the credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('✓ Service account file loaded');
    console.log('  Project ID:', credentials.project_id);
    console.log('  Client email:', credentials.client_email);
    
    // Test authentication
    const auth = new GoogleAuth({ 
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (accessToken.token) {
      console.log('✓ Authentication successful!');
      console.log('  Access token length:', accessToken.token.length);
    } else {
      console.log('✗ No access token received');
    }
    
  } catch (error) {
    console.error('✗ Authentication failed:', error.message);
    console.error('  Stack:', error.stack);
  }
}

testAuth();
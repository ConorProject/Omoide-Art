import { GoogleAuth } from 'google-auth-library';

export default async function handler(req, res) {
  try {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!encodedCredentials || !projectId) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        hasProjectId: !!projectId,
        hasCredentials: !!encodedCredentials
      });
    }

    // Test credential decoding
    const decodedCredsString = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(decodedCredsString);

    // Test GoogleAuth client creation
    const auth = new GoogleAuth({ credentials });
    
    // Test getting an access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    res.status(200).json({ 
      success: true,
      projectId,
      credentialType: credentials.type,
      clientEmail: credentials.client_email,
      hasAccessToken: !!accessToken.token
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Authentication test failed',
      message: error.message,
      stack: error.stack
    });
  }
}
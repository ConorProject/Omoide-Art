module.exports = async function handler(req, res) {
  try {
    console.log('=== DEBUG ENDPOINT START ===');
    
    // Check environment variables
    const hasProjectId = !!process.env.GOOGLE_PROJECT_ID;
    const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    console.log('Has GOOGLE_PROJECT_ID:', hasProjectId);
    console.log('Has GOOGLE_APPLICATION_CREDENTIALS_JSON:', hasCredentials);
    
    if (hasProjectId) {
      console.log('Project ID:', process.env.GOOGLE_PROJECT_ID);
    }
    
    if (hasCredentials) {
      try {
        // Try to decode base64
        const credentialsJson = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, 'base64').toString('utf8');
        const credentials = JSON.parse(credentialsJson);
        console.log('Credentials project_id:', credentials.project_id);
        console.log('Credentials type:', credentials.type);
        console.log('Credentials client_email:', credentials.client_email);
      } catch (error) {
        console.error('Error parsing credentials:', error.message);
      }
    }
    
    console.log('=== DEBUG ENDPOINT END ===');
    
    return res.status(200).json({
      hasProjectId,
      hasCredentials,
      projectId: process.env.GOOGLE_PROJECT_ID || 'missing',
      message: 'Debug info logged to console'
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({ error: error.message });
  }
};
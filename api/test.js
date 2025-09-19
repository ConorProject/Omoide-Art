export default async function handler(req, res) {
  try {
    console.log('🔍 Test endpoint called');
    console.log('Environment variables available:');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Missing');
    console.log('WAVESPEED_API_KEY:', process.env.WAVESPEED_API_KEY ? 'Set' : 'Missing');
    console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'Set' : 'Missing');

    return res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      environmentCheck: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Missing',
        WAVESPEED_API_KEY: process.env.WAVESPEED_API_KEY ? 'Set' : 'Missing',
        BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 'Set' : 'Missing'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
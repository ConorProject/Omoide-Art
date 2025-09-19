async function checkWavespeedStatus(requestId) {
  try {
    console.log(`🔍 Checking status for request: ${requestId}`);

    const url = `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`;
    const headers = {
      "Authorization": `Bearer ${process.env.WAVESPEED_API_KEY}`
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();

    // According to Wavespeed docs: result.data.status is the status field
    const status = result.data?.status || 'unknown';
    console.log(`📊 Status for ${requestId}: ${status}`);

    return result;

  } catch (error) {
    console.error(`❌ Failed to check status for ${requestId}:`, error.message);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { requestId } = req.query;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    console.log(`🔍 Checking status for request: ${requestId}`);

    const result = await checkWavespeedStatus(requestId);

    // Return the status result directly to the client
    return res.status(200).json({
      success: true,
      requestId: requestId,
      status: result.status || result.data?.status || 'unknown',
      data: result
    });

  } catch (error) {
    console.error('=== CHECK STATUS ERROR ===');
    console.error('Error:', error.message);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Failed to check status',
      error: error.message
    });
  }
};
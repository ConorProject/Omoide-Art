function aspectRatioToSize(aspectRatio) {
  const sizeMap = {
    "1:1": "4096*4096",
    "3:4": "3072*4096",
    "4:3": "4096*3072"
  };
  return sizeMap[aspectRatio] || "4096*4096";
}

async function submitImageJob(prompt, aspectRatio = '1:1') {
  try {
    console.log('🚀 Submitting async image job...');

    const url = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/sequential";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.WAVESPEED_API_KEY}`
    };

    const payload = {
      "prompt": prompt,
      "size": aspectRatioToSize(aspectRatio),
      "max_images": 1,
      "enable_base64_output": false,
      "enable_sync_mode": false
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();

    if (!result.data || !result.data.id) {
      throw new Error('No request ID returned from API');
    }

    console.log(`✅ Job submitted with request_id: ${result.data.id}`);
    return result.data.id;

  } catch (error) {
    console.error(`❌ Image job submission failed: ${error.message}`);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify webhook secret
    const webhookSecret = req.headers['x-webhook-secret'];
    const expectedSecret = process.env.WEBHOOK_SECRET || 'webhook-secret-key';

    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.warn('🚨 Unauthorized webhook attempt');
      return res.status(401).json({ message: 'Unauthorized webhook request' });
    }

    const { galleryId, imageIndex, enhancedPrompt, aspectRatio } = req.body;

    if (!galleryId || !imageIndex || !enhancedPrompt) {
      return res.status(400).json({
        message: 'Missing required parameters: galleryId, imageIndex, enhancedPrompt'
      });
    }

    console.log(`🎨 Processing webhook for gallery ${galleryId}, image ${imageIndex}...`);

    // Submit async image job
    const requestId = await submitImageJob(enhancedPrompt, aspectRatio);

    console.log(`✅ Webhook completed for image ${imageIndex} in gallery ${galleryId}`);
    console.log(`📋 Job submitted with request_id: ${requestId}`);

    return res.status(200).json({
      success: true,
      galleryId,
      imageIndex,
      requestId: requestId,
      message: `Image ${imageIndex} job submitted successfully`
    });

  } catch (error) {
    console.error('=== WEBHOOK GENERATION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Webhook image generation failed',
      error: error.message
    });
  }
};
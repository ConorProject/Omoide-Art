function aspectRatioToSize(aspectRatio) {
  const sizeMap = {
    "1:1": "4096*4096",
    "3:4": "3072*4096",
    "4:3": "4096*3072"
  };
  return sizeMap[aspectRatio] || "4096*4096";
}

async function generateSingleImage(prompt, aspectRatio = '1:1') {
  try {
    console.log('🚀 Generating single image...');

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
      "enable_sync_mode": true
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

    if (!result.data || !result.data.outputs || result.data.outputs.length === 0) {
      throw new Error('No images returned from API');
    }

    console.log(`✅ Generated 1 image successfully`);
    return result.data.outputs[0];

  } catch (error) {
    console.error(`❌ Single image generation failed: ${error.message}`);
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

    // Generate single image
    const imageUrl = await generateSingleImage(enhancedPrompt, aspectRatio);

    console.log(`✅ Webhook completed for image ${imageIndex} in gallery ${galleryId}`);
    console.log(`📸 Generated image URL: ${imageUrl}`);

    return res.status(200).json({
      success: true,
      galleryId,
      imageIndex,
      imageUrl: imageUrl,
      message: `Image ${imageIndex} generated successfully`
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
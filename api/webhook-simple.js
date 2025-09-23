function aspectRatioToSize(aspectRatio) {
  const sizeMap = {
    "1:1": "4096*4096",
    "3:4": "3072*4096",
    "4:3": "4096*3072"
  };
  return sizeMap[aspectRatio] || "4096*4096";
}

async function generateImagesSync(prompt, aspectRatio = '1:1') {
  try {
    console.log('🚀 Generating 4 images synchronously...');

    const url = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/sequential";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.WAVESPEED_API_KEY}`
    };

    const payload = {
      "prompt": prompt,
      "size": aspectRatioToSize(aspectRatio),
      "max_images": 4,
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
    console.log('🔍 Wavespeed API response:', JSON.stringify(result, null, 2));

    if (!result.data || !result.data.outputs || result.data.outputs.length === 0) {
      throw new Error(`No image URLs returned. Response: ${JSON.stringify(result)}`);
    }

    const imageUrls = result.data.outputs;
    console.log(`✅ Generated ${imageUrls.length} images: ${imageUrls.join(', ')}`);
    return imageUrls;

  } catch (error) {
    console.error(`❌ Image generation failed: ${error.message}`);
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

    const { galleryId, enhancedPrompt, aspectRatio } = req.body;

    if (!galleryId || !enhancedPrompt) {
      return res.status(400).json({
        message: 'Missing required parameters: galleryId, enhancedPrompt'
      });
    }

    console.log(`🎨 Processing webhook for gallery ${galleryId} - generating all 4 images...`);

    // Generate all 4 images synchronously
    const imageUrls = await generateImagesSync(enhancedPrompt, aspectRatio);

    console.log(`✅ Webhook completed for gallery ${galleryId}`);
    console.log(`🖼️ All 4 Image URLs: ${imageUrls.join(', ')}`);

    // Update gallery metadata in blob storage
    try {
      const { put, list } = require('@vercel/blob');

      // Try to fetch existing metadata
      let galleryData;
      try {
        const { blobs } = await list({
          prefix: `galleries/${galleryId}/metadata.json`,
          limit: 1
        });

        if (blobs.length > 0) {
          const metadataResponse = await fetch(blobs[0].url);
          galleryData = await metadataResponse.json();
        }
      } catch (error) {
        console.log('📝 No existing metadata found, creating new gallery data');
      }

      // Create or update gallery data
      if (!galleryData) {
        galleryData = {
          id: galleryId,
          status: 'generating',
          progress: { completed: 0, total: 4, failed: 0 },
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          images: [
            { index: 1, status: 'pending', requestId: null },
            { index: 2, status: 'pending', requestId: null },
            { index: 3, status: 'pending', requestId: null },
            { index: 4, status: 'pending', requestId: null }
          ],
          purchased: false,
          viewCount: 0
        };
      }

      // Update images based on what we actually received
      imageUrls.forEach((imageUrl, index) => {
        const imageObj = galleryData.images.find(img => img.index === index + 1);
        if (imageObj) {
          imageObj.status = 'completed';
          imageObj.webUrl = imageUrl;
          imageObj.printUrl = imageUrl;
          imageObj.requestId = imageUrl.split('/').slice(-2, -1)[0]; // Extract ID from URL
        }
      });

      // Update progress - based on actual images received
      galleryData.progress.completed = imageUrls.length;
      galleryData.status = imageUrls.length > 0 ? 'complete' : 'failed';

      // Store updated metadata
      await put(`galleries/${galleryId}/metadata.json`, JSON.stringify(galleryData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      });

      console.log(`📝 Updated gallery metadata: ${imageUrls.length}/4 images completed`);
    } catch (storageError) {
      console.error('❌ Failed to update gallery metadata:', storageError);
      // Don't fail the webhook if storage fails
    }

    return res.status(200).json({
      success: true,
      galleryId,
      imageUrls: imageUrls,
      message: `Generated ${imageUrls.length} image${imageUrls.length === 1 ? '' : 's'} successfully`
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
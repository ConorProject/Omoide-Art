function aspectRatioToSize(aspectRatio) {
  const sizeMap = {
    "1:1": "4096*4096",
    "3:4": "3072*4096",
    "4:3": "4096*3072"
  };
  return sizeMap[aspectRatio] || "4096*4096";
}

async function generateSingleImage(prompt, aspectRatio = '1:1', imageIndex = 1) {
  try {
    console.log(`🚀 Generating image ${imageIndex}/4...`);

    const url = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/sequential";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.WAVESPEED_API_KEY}`
    };

    const payload = {
      "prompt": `Artistic variation ${imageIndex}: ${prompt}`,
      "size": aspectRatioToSize(aspectRatio),
      "max_images": 1,
      "enable_base64_output": false,
      "enable_sync_mode": false
    };

    console.log(`📤 API Payload for image ${imageIndex}:`, JSON.stringify(payload, null, 2));

    // Submit async request and get request ID
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log(`🔍 Wavespeed API response for image ${imageIndex}:`, JSON.stringify(result, null, 2));

    if (!result.data || !result.data.id) {
      throw new Error(`No request ID returned for image ${imageIndex}. Response: ${JSON.stringify(result)}`);
    }

    const requestId = result.data.id;
    console.log(`🎯 Got request ID for image ${imageIndex}: ${requestId}`);

    // Poll for completion
    while (true) {
      const pollResponse = await fetch(
        `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.WAVESPEED_API_KEY}`
          }
        }
      );

      if (!pollResponse.ok) {
        throw new Error(`Polling Error ${pollResponse.status}: ${await pollResponse.text()}`);
      }

      const pollResult = await pollResponse.json();
      const status = pollResult.data.status;

      console.log(`🔄 Image ${imageIndex} status: ${status}`);

      if (status === "completed") {
        if (!pollResult.data.outputs || pollResult.data.outputs.length === 0) {
          throw new Error(`No image URL in completed result for image ${imageIndex}`);
        }
        const imageUrl = pollResult.data.outputs[0];
        console.log(`✅ Generated image ${imageIndex}: ${imageUrl}`);
        return imageUrl;
      } else if (status === "failed") {
        throw new Error(`Image ${imageIndex} generation failed: ${pollResult.data.error || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error(`❌ Image ${imageIndex} generation failed: ${error.message}`);
    throw error;
  }
}

async function generateImagesSequentially(prompt, aspectRatio = '1:1') {
  const imageUrls = [];
  const errors = [];

  for (let i = 1; i <= 4; i++) {
    try {
      const imageUrl = await generateSingleImage(prompt, aspectRatio, i);
      imageUrls.push(imageUrl);
      console.log(`✅ Image ${i}/4 completed: ${imageUrl}`);
    } catch (error) {
      console.error(`❌ Failed to generate image ${i}: ${error.message}`);
      errors.push({ index: i, error: error.message });
      // Continue with remaining images even if one fails
    }
  }

  console.log(`🎨 Generation complete: ${imageUrls.length}/4 images succeeded, ${errors.length} failed`);
  return { imageUrls, errors };
}

async function generateImagesBatch(prompt, aspectRatio = '1:1') {
  try {
    console.log('🚀 Generating 4 images in batch mode...');

    const url = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/sequential";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.WAVESPEED_API_KEY}`
    };

    const payload = {
      "prompt": prompt, // Use prompt as-is for batch generation
      "size": aspectRatioToSize(aspectRatio),
      "max_images": 4,
      "enable_base64_output": false,
      "enable_sync_mode": false
    };

    console.log(`📤 Batch API Payload:`, JSON.stringify(payload, null, 2));

    // Submit async batch request and get request ID
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log('🔍 Batch Wavespeed API response:', JSON.stringify(result, null, 2));

    if (!result.data || !result.data.id) {
      throw new Error(`No request ID returned in batch mode. Response: ${JSON.stringify(result)}`);
    }

    const requestId = result.data.id;
    console.log(`🎯 Got batch request ID: ${requestId}`);

    // Poll for completion
    while (true) {
      const pollResponse = await fetch(
        `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.WAVESPEED_API_KEY}`
          }
        }
      );

      if (!pollResponse.ok) {
        throw new Error(`Batch polling Error ${pollResponse.status}: ${await pollResponse.text()}`);
      }

      const pollResult = await pollResponse.json();
      const status = pollResult.data.status;

      console.log(`🔄 Batch status: ${status}`);

      if (status === "completed") {
        if (!pollResult.data.outputs || pollResult.data.outputs.length === 0) {
          throw new Error(`No image URLs in completed batch result`);
        }
        const imageUrls = pollResult.data.outputs;
        console.log(`✅ Batch generation successful: ${imageUrls.length} images generated`);
        console.log(`🖼️ Image URLs: ${imageUrls.join(', ')}`);

        if (pollResult.data.timings && pollResult.data.timings.inference) {
          console.log(`⏱️ Batch generation took: ${pollResult.data.timings.inference}ms`);
        }

        return imageUrls;
      } else if (status === "failed") {
        throw new Error(`Batch generation failed: ${pollResult.data.error || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error(`❌ Batch image generation failed: ${error.message}`);
    throw error;
  }
}

async function updateGalleryMetadata(galleryId, imageUrls, imageIndex = null) {
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

    // Update images based on what we received
    if (imageIndex) {
      // Single image update
      const imageObj = galleryData.images.find(img => img.index === imageIndex);
      if (imageObj && imageUrls.length > 0) {
        imageObj.status = 'completed';
        imageObj.webUrl = imageUrls[0];
        imageObj.printUrl = imageUrls[0];
        imageObj.requestId = imageUrls[0].split('/').slice(-2, -1)[0]; // Extract ID from URL
      }
    } else {
      // Multiple images update
      imageUrls.forEach((imageUrl, index) => {
        const imageObj = galleryData.images.find(img => img.index === index + 1);
        if (imageObj) {
          imageObj.status = 'completed';
          imageObj.webUrl = imageUrl;
          imageObj.printUrl = imageUrl;
          imageObj.requestId = imageUrl.split('/').slice(-2, -1)[0]; // Extract ID from URL
        }
      });
    }

    // Update progress
    const completedCount = galleryData.images.filter(img => img.status === 'completed').length;
    galleryData.progress.completed = completedCount;
    galleryData.status = completedCount === 4 ? 'complete' : (completedCount > 0 ? 'partial' : 'generating');

    // Store updated metadata
    await put(`galleries/${galleryId}/metadata.json`, JSON.stringify(galleryData), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });

    console.log(`📝 Updated gallery metadata: ${completedCount}/4 images completed`);
  } catch (storageError) {
    console.error('❌ Failed to update gallery metadata:', storageError);
    // Don't fail the webhook if storage fails
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

    const { galleryId, enhancedPrompt, aspectRatio, imageIndex } = req.body;

    if (!galleryId || !enhancedPrompt) {
      return res.status(400).json({
        message: 'Missing required parameters: galleryId, enhancedPrompt'
      });
    }

    // If imageIndex is provided, generate single image, otherwise try batch generation first
    if (imageIndex) {
      console.log(`🎨 Processing webhook for gallery ${galleryId} - generating image ${imageIndex}/4...`);

      // Generate single image
      const imageUrl = await generateSingleImage(enhancedPrompt, aspectRatio, imageIndex);
      const imageUrls = [imageUrl];

      console.log(`✅ Webhook completed for gallery ${galleryId} - image ${imageIndex}`);
      console.log(`🖼️ Image URL: ${imageUrl}`);

      // Update gallery metadata for single image
      await updateGalleryMetadata(galleryId, imageUrls, imageIndex);

      return res.status(200).json({
        success: true,
        galleryId,
        imageUrls: imageUrls,
        imageIndex,
        message: `Generated image ${imageIndex}/4 successfully`
      });

    } else {
      console.log(`🎨 Processing webhook for gallery ${galleryId} - attempting batch generation of 4 images...`);

      try {
        // Try batch generation first (Pro plan has 60s timeout)
        const imageUrls = await generateImagesBatch(enhancedPrompt, aspectRatio);

        console.log(`✅ Batch generation successful for gallery ${galleryId}`);
        console.log(`🖼️ All ${imageUrls.length} Image URLs: ${imageUrls.join(', ')}`);

        // Update gallery metadata for all images
        await updateGalleryMetadata(galleryId, imageUrls);

        return res.status(200).json({
          success: true,
          galleryId,
          imageUrls: imageUrls,
          message: `Generated ${imageUrls.length} images successfully via batch`
        });

      } catch (batchError) {
        console.error(`❌ Batch generation failed: ${batchError.message}`);
        console.log(`🔄 Falling back to sequential generation...`);

        // Fallback to sequential generation
        const { imageUrls, errors } = await generateImagesSequentially(enhancedPrompt, aspectRatio);

        console.log(`✅ Sequential fallback completed for gallery ${galleryId}`);
        console.log(`🖼️ Generated ${imageUrls.length} Image URLs: ${imageUrls.join(', ')}`);

        // Update gallery metadata for all images
        await updateGalleryMetadata(galleryId, imageUrls);

        const success = imageUrls.length > 0;
        const message = errors.length > 0
          ? `Generated ${imageUrls.length}/4 images successfully (batch failed, used sequential), ${errors.length} failed`
          : `Generated ${imageUrls.length} images successfully via sequential fallback`;

        return res.status(success ? 200 : 500).json({
          success,
          galleryId,
          imageUrls: imageUrls,
          errors: errors.length > 0 ? errors : undefined,
          message
        });
      }
    }

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
const { put, list } = require('@vercel/blob');
const sharp = require('sharp');
const path = require('path');

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
      "max_images": 1,  // Single image generation
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

    if (!result.data || !result.data.images || result.data.images.length === 0) {
      throw new Error('No images returned from API');
    }

    console.log(`✅ Generated 1 image successfully`);
    return result.data.images[0]; // Return single image URL

  } catch (error) {
    console.error(`❌ Single image generation failed: ${error.message}`);
    throw error;
  }
}

async function createWatermarkedVersion(imageBuffer) {
  try {
    // For now, skip watermarking to simplify CommonJS conversion
    // TODO: Add watermark later when we have the watermark.png file properly set up
    return imageBuffer;
  } catch (error) {
    console.error('❌ Failed to create watermarked version:', error);
    return imageBuffer;
  }
}

async function resizeForWeb(imageBuffer) {
  try {
    // Resize to 2048x2048 for web display
    const resized = await sharp(imageBuffer)
      .resize(2048, 2048, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    return resized;
  } catch (error) {
    console.error('❌ Failed to resize for web:', error);
    return imageBuffer;
  }
}

async function uploadSingleImageToBlob(imageUrl, galleryId, imageIndex) {
  try {
    console.log(`📤 Uploading image ${imageIndex} to blob storage...`);

    // Fetch the original 4K image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const originalBuffer = await imageResponse.arrayBuffer();
    const originalBufferNode = Buffer.from(originalBuffer);

    // Create web version: resize and watermark
    const webResized = await resizeForWeb(originalBufferNode);
    const webWatermarked = await createWatermarkedVersion(webResized);

    // Upload both versions
    const printFilename = `galleries/${galleryId}/print-${imageIndex}.jpg`;
    const webFilename = `galleries/${galleryId}/web-${imageIndex}.jpg`;

    const [printBlob, webBlob] = await Promise.all([
      put(printFilename, originalBufferNode, {
        access: 'public',
        contentType: 'image/jpeg'
      }),
      put(webFilename, webWatermarked, {
        access: 'public',
        contentType: 'image/jpeg'
      })
    ]);

    console.log(`✅ Uploaded image ${imageIndex}: print + web versions`);

    return {
      index: imageIndex,
      status: 'completed',
      printUrl: printBlob.url,
      webUrl: webBlob.url,
      originalUrl: imageUrl
    };

  } catch (error) {
    console.error(`❌ Failed to upload image ${imageIndex}:`, error);
    return {
      index: imageIndex,
      status: 'failed',
      error: error.message,
      originalUrl: imageUrl
    };
  }
}

async function getGalleryMetadata(galleryId) {
  try {
    const { blobs } = await list({
      prefix: `galleries/${galleryId}/metadata.json`,
      limit: 1
    });

    if (blobs.length === 0) {
      throw new Error('Gallery metadata not found');
    }

    const metadataResponse = await fetch(blobs[0].url);
    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch gallery metadata');
    }

    return await metadataResponse.json();
  } catch (error) {
    console.error('❌ Failed to get gallery metadata:', error);
    throw error;
  }
}

async function updateGalleryMetadata(galleryId, imageResult) {
  try {
    console.log(`🔄 Updating gallery metadata for image ${imageResult.index}...`);

    // Get current metadata
    const metadata = await getGalleryMetadata(galleryId);

    // Update the specific image
    const imageIndex = imageResult.index - 1; // Convert to 0-based index
    metadata.images[imageIndex] = imageResult;

    // Update progress
    const completedImages = metadata.images.filter(img => img.status === 'completed').length;
    const failedImages = metadata.images.filter(img => img.status === 'failed').length;

    metadata.progress = {
      completed: completedImages,
      total: 4,
      failed: failedImages
    };

    // Update overall status
    if (completedImages === 4) {
      metadata.status = 'complete';
    } else if (completedImages + failedImages === 4) {
      metadata.status = 'partial';
    } else {
      metadata.status = 'generating';
    }

    // Upload updated metadata
    const metadataFilename = `galleries/${galleryId}/metadata.json`;
    await put(metadataFilename, JSON.stringify(metadata, null, 2), {
      access: 'public',
      contentType: 'application/json'
    });

    console.log(`✅ Updated gallery metadata: ${completedImages}/4 completed, ${failedImages} failed`);
    return metadata;

  } catch (error) {
    console.error('❌ Failed to update gallery metadata:', error);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify webhook secret with multiple checks
    const webhookSecret = req.headers['x-webhook-secret'];
    const expectedSecret = process.env.WEBHOOK_SECRET || 'webhook-secret-key';

    if (!webhookSecret || !expectedSecret || webhookSecret !== expectedSecret) {
      console.warn('🚨 Unauthorized webhook attempt:', {
        hasSecret: !!webhookSecret,
        hasExpected: !!expectedSecret,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      return res.status(401).json({ message: 'Unauthorized webhook request' });
    }

    // Rate limiting check - prevent spam
    const { galleryId, imageIndex, enhancedPrompt, aspectRatio } = req.body;
    const rateLimitKey = `${galleryId}-${imageIndex}`;
    // In production, you'd use Redis or similar for rate limiting
    console.log(`🔧 Processing webhook for rate limit key: ${rateLimitKey}`);

    if (!galleryId || !imageIndex || !enhancedPrompt) {
      return res.status(400).json({
        message: 'Missing required parameters: galleryId, imageIndex, enhancedPrompt'
      });
    }

    console.log(`🎨 Processing webhook for gallery ${galleryId}, image ${imageIndex}...`);

    // Update image status to 'generating'
    try {
      const metadata = await getGalleryMetadata(galleryId);
      metadata.images[imageIndex - 1].status = 'generating';
      const metadataFilename = `galleries/${galleryId}/metadata.json`;
      await put(metadataFilename, JSON.stringify(metadata, null, 2), {
        access: 'public',
        contentType: 'application/json'
      });
    } catch (error) {
      console.error('❌ Failed to update status to generating:', error);
    }

    // Generate single image
    const imageUrl = await generateSingleImage(enhancedPrompt, aspectRatio);

    // Upload to blob storage
    const uploadResult = await uploadSingleImageToBlob(imageUrl, galleryId, imageIndex);

    // Update gallery metadata
    const updatedMetadata = await updateGalleryMetadata(galleryId, uploadResult);

    console.log(`✅ Webhook completed for image ${imageIndex} in gallery ${galleryId}`);

    return res.status(200).json({
      success: true,
      galleryId,
      imageIndex,
      imageResult: uploadResult,
      galleryStatus: updatedMetadata.status,
      progress: updatedMetadata.progress
    });

  } catch (error) {
    console.error('=== WEBHOOK GENERATION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===');

    // Try to update metadata with error status
    try {
      const { galleryId, imageIndex } = req.body;
      if (galleryId && imageIndex) {
        const errorResult = {
          index: imageIndex,
          status: 'failed',
          error: error.message
        };
        await updateGalleryMetadata(galleryId, errorResult);
      }
    } catch (metadataError) {
      console.error('❌ Failed to update metadata with error:', metadataError);
    }

    return res.status(500).json({
      success: false,
      message: 'Webhook image generation failed',
      error: error.message
    });
  }
}
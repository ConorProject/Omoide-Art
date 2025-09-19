import { put, list } from '@vercel/blob';

// Helper functions for gallery metadata management

export async function getGalleryMetadata(galleryId) {
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

export async function updateGalleryProgress(galleryId, imageIndex, imageResult) {
  try {
    console.log(`🔄 Updating gallery progress for image ${imageIndex}...`);

    // Get current metadata
    const metadata = await getGalleryMetadata(galleryId);

    // Update the specific image
    const arrayIndex = imageIndex - 1; // Convert to 0-based index
    metadata.images[arrayIndex] = imageResult;

    // Recalculate progress
    const completedImages = metadata.images.filter(img => img.status === 'completed').length;
    const failedImages = metadata.images.filter(img => img.status === 'failed').length;
    const generatingImages = metadata.images.filter(img => img.status === 'generating').length;

    metadata.progress = {
      completed: completedImages,
      total: 4,
      failed: failedImages,
      generating: generatingImages
    };

    // Update overall status
    if (completedImages === 4) {
      metadata.status = 'complete';
    } else if (completedImages + failedImages === 4) {
      metadata.status = 'partial';
    } else {
      metadata.status = 'generating';
    }

    // Save updated metadata
    const metadataFilename = `galleries/${galleryId}/metadata.json`;
    await put(metadataFilename, JSON.stringify(metadata, null, 2), {
      access: 'public',
      contentType: 'application/json'
    });

    console.log(`✅ Gallery progress updated: ${completedImages}/4 completed, ${failedImages} failed`);
    return metadata;

  } catch (error) {
    console.error('❌ Failed to update gallery progress:', error);
    throw error;
  }
}

export async function setImageStatus(galleryId, imageIndex, status, additionalData = {}) {
  try {
    const metadata = await getGalleryMetadata(galleryId);

    const imageUpdate = {
      index: imageIndex,
      status: status,
      ...additionalData
    };

    return await updateGalleryProgress(galleryId, imageIndex, imageUpdate);
  } catch (error) {
    console.error(`❌ Failed to set image ${imageIndex} status to ${status}:`, error);
    throw error;
  }
}

// API endpoint for manual gallery updates (if needed)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { action, galleryId, imageIndex, imageData } = req.body;

    if (!galleryId) {
      return res.status(400).json({ message: 'Gallery ID is required' });
    }

    switch (action) {
      case 'update-image':
        if (!imageIndex || !imageData) {
          return res.status(400).json({ message: 'Image index and data are required' });
        }
        const updatedMetadata = await updateGalleryProgress(galleryId, imageIndex, imageData);
        return res.status(200).json({
          success: true,
          metadata: updatedMetadata
        });

      case 'set-status':
        const { status, additionalData } = req.body;
        if (!imageIndex || !status) {
          return res.status(400).json({ message: 'Image index and status are required' });
        }
        const statusMetadata = await setImageStatus(galleryId, imageIndex, status, additionalData);
        return res.status(200).json({
          success: true,
          metadata: statusMetadata
        });

      case 'get-metadata':
        const metadata = await getGalleryMetadata(galleryId);
        return res.status(200).json({
          success: true,
          metadata: metadata
        });

      default:
        return res.status(400).json({
          message: 'Invalid action. Use: update-image, set-status, or get-metadata'
        });
    }

  } catch (error) {
    console.error('=== GALLERY UPDATE ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Gallery update failed',
      error: error.message
    });
  }
}
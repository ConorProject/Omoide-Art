import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageUrls, galleryId } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: 'Valid imageUrls array required' });
    }

    const uploadPromises = imageUrls.map(async (imageUrl, index) => {
      try {
        // Fetch the image from the URL
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }

        // Get the image buffer
        const imageBuffer = await imageResponse.arrayBuffer();

        // Generate a unique filename
        const filename = `omoide-${galleryId || uuidv4()}-${index + 1}.jpg`;

        // Upload to Vercel Blob
        const blob = await put(filename, imageBuffer, {
          access: 'public',
          contentType: 'image/jpeg'
        });

        console.log(`✅ Uploaded ${filename} to blob storage: ${blob.url}`);

        return {
          originalUrl: imageUrl,
          blobUrl: blob.url,
          filename: filename,
          index: index
        };
      } catch (error) {
        console.error(`❌ Failed to upload image ${index + 1}:`, error);
        return {
          originalUrl: imageUrl,
          blobUrl: null,
          error: error.message,
          index: index
        };
      }
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Separate successful and failed uploads
    const successful = uploadResults.filter(result => result.blobUrl);
    const failed = uploadResults.filter(result => !result.blobUrl);

    console.log(`📊 Upload summary: ${successful.length} successful, ${failed.length} failed`);

    return res.status(200).json({
      success: true,
      galleryId: galleryId || uuidv4(),
      uploadedImages: successful,
      failedUploads: failed,
      summary: {
        total: imageUrls.length,
        successful: successful.length,
        failed: failed.length
      }
    });

  } catch (error) {
    console.error('❌ Upload images error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload images to blob storage',
      error: error.message
    });
  }
}
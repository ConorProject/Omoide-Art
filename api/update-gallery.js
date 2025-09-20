module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { galleryId, imageIndex, requestId, status, webUrl, printUrl } = req.body;

    if (!galleryId || !imageIndex) {
      return res.status(400).json({
        success: false,
        message: 'Gallery ID and image index are required'
      });
    }

    console.log(`📝 Updating gallery ${galleryId} - Image ${imageIndex} with requestId: ${requestId}, status: ${status}`);

    try {
      const { put, list } = require('@vercel/blob');

      // Try to load existing metadata
      let galleryData = null;
      try {
        const { blobs } = await list({
          prefix: `galleries/${galleryId}/metadata.json`,
          limit: 1
        });

        if (blobs.length > 0) {
          const metadataResponse = await fetch(blobs[0].url);
          if (metadataResponse.ok) {
            galleryData = await metadataResponse.json();
          }
        }
      } catch (error) {
        console.log('No existing metadata found, creating new structure');
      }

      // Create default structure if no existing metadata
      if (!galleryData) {
        // Decode userInputs from galleryId
        let userInputs = {
          location: 'Tokyo',
          atmosphere: 'golden',
          focus: 'cherry blossoms',
          detail: 'pink petals falling',
          feelings: ['peaceful', 'nostalgic'],
          aspectRatio: '1:1',
          season: 'spring'
        };

        try {
          const parts = galleryId.split('_');
          if (parts.length >= 2) {
            const encodedInputs = parts.slice(1).join('_');
            const decodedInputs = JSON.parse(Buffer.from(encodedInputs, 'base64').toString());
            userInputs = decodedInputs;
          }
        } catch (error) {
          console.log('⚠️ Failed to decode user inputs in update-gallery, using defaults:', error.message);
        }

        galleryData = {
          id: galleryId,
          status: 'generating',
          progress: { completed: 0, total: 4, failed: 0 },
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          userInputs: userInputs,
          images: [
            { index: 1, status: 'pending', requestId: null },
            { index: 2, status: 'pending', requestId: null },
            { index: 3, status: 'pending', requestId: null },
            { index: 4, status: 'pending', requestId: null }
          ],
          purchased: false,
          viewCount: 1
        };
      }

      // Update the specific image
      const imageIdx = galleryData.images.findIndex(img => img.index === imageIndex);
      if (imageIdx !== -1) {
        if (requestId) galleryData.images[imageIdx].requestId = requestId;
        if (status) galleryData.images[imageIdx].status = status;
        if (webUrl) galleryData.images[imageIdx].webUrl = webUrl;
        if (printUrl) galleryData.images[imageIdx].printUrl = printUrl;

        console.log(`✅ Updated image ${imageIndex}: ${JSON.stringify(galleryData.images[imageIdx])}`);
      }

      // Update gallery progress
      const completed = galleryData.images.filter(img => img.status === 'completed').length;
      const failed = galleryData.images.filter(img => img.status === 'failed').length;
      const generating = galleryData.images.filter(img => img.status === 'generating').length;

      galleryData.progress = { completed, total: 4, failed, generating };

      if (completed === 4) {
        galleryData.status = 'complete';
      } else if (completed + failed === 4) {
        galleryData.status = 'partial';
      } else {
        galleryData.status = 'generating';
      }

      // Save updated metadata
      await put(`galleries/${galleryId}/metadata.json`, JSON.stringify(galleryData, null, 2), {
        access: 'public'
      });

      console.log(`✅ Gallery metadata saved for ${galleryId}`);

    } catch (blobError) {
      console.error('Blob storage error, continuing without persistence:', blobError.message);
    }

    return res.status(200).json({
      success: true,
      message: `Gallery ${galleryId} updated - Image ${imageIndex} updated successfully`
    });

  } catch (error) {
    console.error('=== UPDATE GALLERY ERROR ===');
    console.error('Error:', error.message);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Failed to update gallery',
      error: error.message
    });
  }
};
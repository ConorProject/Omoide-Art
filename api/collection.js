module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { galleryIds } = req.body;

    if (!galleryIds || !Array.isArray(galleryIds) || galleryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Gallery IDs array is required'
      });
    }

    console.log(`🎨 Fetching collection for ${galleryIds.length} galleries:`, galleryIds);

    // Fetch all galleries in parallel
    const galleryPromises = galleryIds.map(async (galleryId) => {
      try {
        // Use the existing gallery API logic
        const galleryResponse = await fetchSingleGallery(galleryId);
        return galleryResponse;
      } catch (error) {
        console.warn(`⚠️ Failed to fetch gallery ${galleryId}:`, error.message);
        return null; // Skip failed galleries
      }
    });

    const galleryResults = await Promise.all(galleryPromises);
    const validGalleries = galleryResults.filter(gallery => gallery !== null);

    if (validGalleries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid galleries found'
      });
    }

    // Aggregate collection data
    const collection = {
      totalGalleries: validGalleries.length,
      totalImages: validGalleries.reduce((total, gallery) => total + gallery.images.length, 0),
      completedImages: validGalleries.reduce((total, gallery) =>
        total + gallery.images.filter(img => img.status === 'completed').length, 0
      ),
      galleries: validGalleries.map(gallery => ({
        id: gallery.id,
        status: gallery.status,
        userInputs: gallery.userInputs,
        images: gallery.images,
        createdAt: gallery.createdAt,
        expiresAt: gallery.expiresAt,
        timeRemaining: Math.max(0, new Date(gallery.expiresAt) - new Date()),
        purchased: gallery.purchased || false
      })),
      earliestExpiry: Math.min(...validGalleries.map(g => new Date(g.expiresAt).getTime())),
      createdAt: new Date().toISOString()
    };

    console.log(`✅ Collection assembled: ${collection.totalGalleries} galleries, ${collection.completedImages}/${collection.totalImages} images completed`);

    return res.status(200).json({
      success: true,
      collection: collection
    });

  } catch (error) {
    console.error('=== COLLECTION API ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Unable to load collection',
      error: error.message
    });
  }
};

// Helper function to fetch a single gallery (reused from gallery.js logic)
async function fetchSingleGallery(galleryId) {
  // Default user inputs fallback
  let userInputs = {
    location: 'Tokyo',
    atmosphere: 'golden',
    focus: 'cherry blossoms',
    detail: 'pink petals falling',
    feelings: ['peaceful', 'nostalgic'],
    aspectRatio: '1:1',
    season: 'spring'
  };

  // Decode user inputs from gallery ID
  try {
    const parts = galleryId.split('_');
    if (parts.length >= 2) {
      const encodedInputs = parts.slice(1).join('_');
      const decodedInputs = JSON.parse(Buffer.from(encodedInputs, 'base64').toString());
      userInputs = decodedInputs;
    }
  } catch (error) {
    console.log('⚠️ Failed to decode user inputs for gallery', galleryId, '- using defaults');
  }

  // Try to fetch metadata from blob storage
  let galleryData;
  try {
    const { list } = require('@vercel/blob');
    const { blobs } = await list({
      prefix: `galleries/${galleryId}/metadata.json`,
      limit: 1
    });

    if (blobs.length > 0) {
      const metadataResponse = await fetch(blobs[0].url);
      if (metadataResponse.ok) {
        galleryData = await metadataResponse.json();
        console.log(`✅ Found existing metadata for gallery ${galleryId}`);
      } else {
        throw new Error('Failed to fetch metadata');
      }
    } else {
      throw new Error('No metadata found');
    }
  } catch (error) {
    console.log(`📝 Creating new gallery data for ${galleryId}:`, error.message);

    // Create default gallery structure
    let images = [
      { index: 1, status: 'pending', requestId: null },
      { index: 2, status: 'pending', requestId: null },
      { index: 3, status: 'pending', requestId: null },
      { index: 4, status: 'pending', requestId: null }
    ];


    galleryData = {
      id: galleryId,
      status: 'generating',
      progress: { completed: 0, total: 4, failed: 0 },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      userInputs: userInputs,
      images: images,
      purchased: false,
      viewCount: 1
    };
  }

  // Ensure userInputs are always present
  if (!galleryData.userInputs) {
    galleryData.userInputs = userInputs;
  }

  return galleryData;
}
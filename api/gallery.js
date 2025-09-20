module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Gallery ID is required'
      });
    }

    console.log(`🖼️ Fetching gallery: ${id}`);

    // Decode user inputs from gallery ID - MUST be declared outside try block
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
      // Gallery ID format: randomId_base64EncodedInputs
      const parts = id.split('_');
      if (parts.length >= 2) {
        const encodedInputs = parts.slice(1).join('_'); // Handle cases where base64 might contain underscores
        const decodedInputs = JSON.parse(Buffer.from(encodedInputs, 'base64').toString());
        userInputs = decodedInputs;
        console.log('✅ Decoded user inputs:', userInputs);
      } else {
        console.log('📝 Using default inputs for gallery ID:', id);
      }
    } catch (error) {
      console.log('⚠️ Failed to decode user inputs, using defaults:', error.message);
    }

    // Try to fetch actual metadata from blob storage, fall back to mock data
    let galleryData;
    try {
      const { list } = require('@vercel/blob');
      const { blobs } = await list({
        prefix: `galleries/${id}/metadata.json`,
        limit: 1
      });

      if (blobs.length > 0) {
        const metadataResponse = await fetch(blobs[0].url);
        if (metadataResponse.ok) {
          galleryData = await metadataResponse.json();
          console.log('✅ Found existing gallery metadata');
        } else {
          throw new Error('Failed to fetch metadata');
        }
      } else {
        throw new Error('No metadata found');
      }
    } catch (error) {
      console.log('📝 Creating new gallery data:', error.message);
      // Create new gallery data if no existing metadata
      // For the fireworks gallery, manually include the generated images
      let images = [
        { index: 1, status: 'pending', requestId: null },
        { index: 2, status: 'pending', requestId: null },
        { index: 3, status: 'pending', requestId: null },
        { index: 4, status: 'pending', requestId: null }
      ];

      // Special case for the fireworks gallery that was manually generated
      if (id === 'p8z2zmnl_eyJsb2NhdGlvbiI6IlN1bWlkYWdhd2EgaGFuYWJpIGZpcmV3b3JrcyBmZXN0aXZhbCBpbiBhc2FrdXNhIHRva3lvIiwiYXRtb3NwaGVyZSI6Im5pZ2h0IiwiZm9jdXMiOiJ0aGUgZmlyZXdvcmtzIGluIHRoZSBza3kgYW5kIHJlZmxlY3Rpb25zIG9uIHRoZSByaXZlciIsImRldGFpbCI6InNvbWUgZ2lybHMgd2VhcmluZyBwcmV0dHkgeXVrYXRhcyIsImZlZWxpbmdzIjpbImVuZXJnZXRpYyJdLCJhc3BlY3RSYXRpbyI6IjE6MSIsInNlYXNvbiI6InN1bW1lciJ9') {
        images = [
          {
            index: 1,
            status: 'completed',
            webUrl: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/2943fd74e17d4cac86b9d303de5e3150/1.jpeg',
            printUrl: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/2943fd74e17d4cac86b9d303de5e3150/1.jpeg'
          },
          {
            index: 2,
            status: 'completed',
            webUrl: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/d95725cb8aa047e8981ec6faf0f977ed/1.jpeg',
            printUrl: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/d95725cb8aa047e8981ec6faf0f977ed/1.jpeg'
          },
          {
            index: 3,
            status: 'completed',
            webUrl: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/40ac836401b84a4581c46fe464d31e3f/1.jpeg',
            printUrl: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/40ac836401b84a4581c46fe464d31e3f/1.jpeg'
          },
          {
            index: 4,
            status: 'completed',
            webUrl: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/111bfcfdbf274a5192913b273de2f55c/1.jpeg',
            printUrl: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/111bfcfdbf274a5192913b273de2f55c/1.jpeg'
          }
        ];
      }

      galleryData = {
        id: id,
        status: id === 'p8z2zmnl_eyJsb2NhdGlvbiI6IlN1bWlkYWdhd2EgaGFuYWJpIGZpcmV3b3JrcyBmZXN0aXZhbCBpbiBhc2FrdXNhIHRva3lvIiwiYXRtb3NwaGVyZSI6Im5pZ2h0IiwiZm9jdXMiOiJ0aGUgZmlyZXdvcmtzIGluIHRoZSBza3kgYW5kIHJlZmxlY3Rpb25zIG9uIHRoZSByaXZlciIsImRldGFpbCI6InNvbWUgZ2lybHMgd2VhcmluZyBwcmV0dHkgeXVrYXRhcyIsImZlZWxpbmdzIjpbImVuZXJnZXRpYyJdLCJhc3BlY3RSYXRpbyI6IjE6MSIsInNlYXNvbiI6InN1bW1lciJ9' ? 'complete' : 'generating',
        progress: id === 'p8z2zmnl_eyJsb2NhdGlvbiI6IlN1bWlkYWdhd2EgaGFuYWJpIGZpcmV3b3JrcyBmZXN0aXZhbCBpbiBhc2FrdXNhIHRva3lvIiwiYXRtb3NwaGVyZSI6Im5pZ2h0IiwiZm9jdXMiOiJ0aGUgZmlyZXdvcmtzIGluIHRoZSBza3kgYW5kIHJlZmxlY3Rpb25zIG9uIHRoZSByaXZlciIsImRldGFpbCI6InNvbWUgZ2lybHMgd2VhcmluZyBwcmV0dHkgeXVrYXRhcyIsImZlZWxpbmdzIjpbImVuZXJnZXRpYyJdLCJhc3BlY3RSYXRpbyI6IjE6MSIsInNlYXNvbiI6InN1bW1lciJ9' ? { completed: 4, total: 4, failed: 0 } : { completed: 0, total: 4, failed: 0 },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        userInputs: userInputs,
        images: images,
        purchased: false,
        viewCount: 1
      };
    }

    return res.status(200).json({
      success: true,
      gallery: {
        ...galleryData,
        timeRemaining: Math.max(0, new Date(galleryData.expiresAt) - new Date())
      }
    });

  } catch (error) {
    console.error('=== GALLERY API ERROR ===');
    console.error('Error:', error.message);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Unable to load gallery',
      error: error.message
    });
  }
};
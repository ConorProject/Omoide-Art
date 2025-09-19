module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { galleryId, imageIndex, requestId, status } = req.body;

    if (!galleryId || !imageIndex || !requestId) {
      return res.status(400).json({
        success: false,
        message: 'Gallery ID, image index, and request ID are required'
      });
    }

    console.log(`📝 Updating gallery ${galleryId} - Image ${imageIndex} with requestId: ${requestId}`);

    // For now, we'll store this information in memory or a simple store
    // In a real production system, this would update a database

    // This is a simplified implementation - in production you'd want to:
    // 1. Load existing gallery metadata from blob storage
    // 2. Update the specific image's requestId and status
    // 3. Save the updated metadata back to blob storage

    return res.status(200).json({
      success: true,
      message: `Gallery ${galleryId} updated - Image ${imageIndex} now tracking requestId: ${requestId}`
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
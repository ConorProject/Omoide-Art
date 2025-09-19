// Vercel Cron Job for automatic gallery cleanup
// This function runs daily to clean up expired galleries

export default async function handler(req, res) {
  // Verify this is a Vercel cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🕐 Daily cleanup cron job triggered');

    // Call the cleanup API
    const cleanupResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cleanup-expired`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.CLEANUP_SECRET || 'cleanup-secret-key'
      })
    });

    const cleanupResult = await cleanupResponse.json();

    if (cleanupResult.success) {
      console.log(`✅ Cleanup completed: ${cleanupResult.message}`);
      return res.status(200).json({
        success: true,
        message: 'Daily cleanup completed successfully',
        details: cleanupResult
      });
    } else {
      throw new Error(cleanupResult.message || 'Cleanup failed');
    }

  } catch (error) {
    console.error('❌ Cron cleanup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Daily cleanup failed',
      error: error.message
    });
  }
}
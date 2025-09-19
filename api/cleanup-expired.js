import { list, del } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - prefer process.env for Vercel deployment
const envVars = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  WAVESPEED_API_KEY: process.env.WAVESPEED_API_KEY,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  CLEANUP_SECRET: process.env.CLEANUP_SECRET || 'cleanup-secret-key'
};

// Fallback to .env.local for local development
if (!envVars.GEMINI_API_KEY || !envVars.WAVESPEED_API_KEY) {
  try {
    const envPath = path.join(path.dirname(__dirname), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !envVars[key]) {
        envVars[key] = value;
      }
    });
  } catch (error) {
    console.warn('Could not load .env.local file:', error.message);
  }
}

async function findExpiredGalleries() {
  try {
    console.log('🔍 Scanning for expired galleries...');

    // List all gallery metadata files
    const { blobs } = await list({
      prefix: 'galleries/',
      limit: 1000
    });

    const metadataFiles = blobs.filter(blob => blob.pathname.endsWith('/metadata.json'));
    const expiredGalleries = [];
    const now = new Date();

    console.log(`📊 Found ${metadataFiles.length} gallery metadata files`);

    // Check each gallery for expiration
    for (const metadataBlob of metadataFiles) {
      try {
        // Fetch metadata
        const response = await fetch(metadataBlob.url);
        if (!response.ok) continue;

        const metadata = await response.json();
        const expiresAt = new Date(metadata.expiresAt);

        // Check if expired and not purchased
        if (now > expiresAt && !metadata.purchased) {
          expiredGalleries.push({
            galleryId: metadata.id,
            expiredAt: expiresAt,
            daysExpired: Math.floor((now - expiresAt) / (1000 * 60 * 60 * 24))
          });
        }

      } catch (error) {
        console.warn(`⚠️ Failed to check gallery ${metadataBlob.pathname}:`, error.message);
      }
    }

    console.log(`🗑️ Found ${expiredGalleries.length} expired galleries`);
    return expiredGalleries;

  } catch (error) {
    console.error('❌ Error finding expired galleries:', error);
    throw error;
  }
}

async function deleteGalleryFiles(galleryId) {
  try {
    console.log(`🗑️ Deleting gallery: ${galleryId}`);

    // List all files for this gallery
    const { blobs } = await list({
      prefix: `galleries/${galleryId}/`,
      limit: 100
    });

    if (blobs.length === 0) {
      console.log(`ℹ️ No files found for gallery ${galleryId}`);
      return { deleted: 0 };
    }

    // Delete all files in parallel
    const deletePromises = blobs.map(async (blob) => {
      try {
        await del(blob.url);
        return { success: true, file: blob.pathname };
      } catch (error) {
        console.warn(`⚠️ Failed to delete ${blob.pathname}:`, error.message);
        return { success: false, file: blob.pathname, error: error.message };
      }
    });

    const deleteResults = await Promise.all(deletePromises);
    const successful = deleteResults.filter(r => r.success).length;
    const failed = deleteResults.filter(r => !r.success).length;

    console.log(`✅ Gallery ${galleryId}: deleted ${successful} files, ${failed} failed`);

    return {
      deleted: successful,
      failed: failed,
      details: deleteResults
    };

  } catch (error) {
    console.error(`❌ Error deleting gallery ${galleryId}:`, error);
    throw error;
  }
}

async function performCleanup() {
  try {
    const startTime = Date.now();
    console.log('🧹 Starting expired gallery cleanup...');

    // Find expired galleries
    const expiredGalleries = await findExpiredGalleries();

    if (expiredGalleries.length === 0) {
      console.log('✨ No expired galleries found');
      return {
        success: true,
        processed: 0,
        deleted: 0,
        failed: 0,
        duration: Date.now() - startTime
      };
    }

    // Delete expired galleries
    let totalDeleted = 0;
    let totalFailed = 0;
    const cleanupResults = [];

    for (const gallery of expiredGalleries) {
      try {
        const result = await deleteGalleryFiles(gallery.galleryId);
        totalDeleted += result.deleted;
        totalFailed += result.failed;

        cleanupResults.push({
          galleryId: gallery.galleryId,
          daysExpired: gallery.daysExpired,
          filesDeleted: result.deleted,
          filesFailed: result.failed
        });

      } catch (error) {
        totalFailed++;
        cleanupResults.push({
          galleryId: gallery.galleryId,
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Cleanup completed in ${duration}ms`);
    console.log(`📊 Processed: ${expiredGalleries.length}, Files deleted: ${totalDeleted}, Failed: ${totalFailed}`);

    return {
      success: true,
      processed: expiredGalleries.length,
      deleted: totalDeleted,
      failed: totalFailed,
      duration: duration,
      details: cleanupResults
    };

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Security check - require secret key
    const { secret } = req.body;

    if (!secret || secret !== envVars.CLEANUP_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid cleanup secret'
      });
    }

    console.log('🔐 Cleanup authorized, starting process...');

    // Perform the cleanup
    const result = await performCleanup();

    return res.status(200).json({
      success: true,
      message: `Cleanup completed: processed ${result.processed} galleries, deleted ${result.deleted} files`,
      ...result
    });

  } catch (error) {
    console.error('=== CLEANUP ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
}
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(path.dirname(__dirname), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key] = value;
});

// Simple status check endpoint for async job polling
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID required' });
    }

    console.log(`🔍 Checking status for job: ${jobId}`);

    // Check job status via Wavespeed API
    const pollUrl = `https://api.wavespeed.ai/api/v3/predictions/${jobId}/result`;

    const response = await fetch(pollUrl, {
      headers: {
        "Authorization": `Bearer ${envVars.WAVESPEED_API_KEY}`
      }
    });

    if (!response.ok) {
      console.log(`❌ Status check failed: ${response.status}`);
      return res.status(200).json({
        status: 'error',
        message: 'Unable to check job status'
      });
    }

    const result = await response.json();

    // Extract status from the correct data structure per Wavespeed documentation
    const data = result.data;
    const jobStatus = data?.status || 'pending';
    const outputs = data?.outputs || []; // This is an array per the docs

    console.log(`📊 Job ${jobId} status: ${jobStatus}`);
    console.log(`📊 Data keys:`, data ? Object.keys(data) : 'no data');

    if (jobStatus === 'completed') {
      return res.status(200).json({
        status: 'completed',
        imageUrls: outputs
      });
    } else if (jobStatus === 'failed') {
      return res.status(200).json({
        status: 'failed',
        message: data?.error || 'Image generation failed'
      });
    } else {
      return res.status(200).json({
        status: 'pending',
        message: 'Image generation in progress...'
      });
    }

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(200).json({
      status: 'error',
      message: 'Unable to check job status'
    });
  }
}
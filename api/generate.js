function constructArtisticPrompt({ location, atmosphere, focus, detail, feelings }) {
  const atmosphereMap = {
    'sunny': 'under brilliant clear skies with crisp shadows and warm sunlight filtering through',
    'golden': 'bathed in warm golden hour light with soft atmospheric glow',
    'overcast': 'beneath softly overcast skies with gentle, diffused lighting',
    'rainy': 'swept by gentle rain with reflections glistening on wet surfaces',
    'night': 'at twilight under deep indigo skies with soft lantern light'
  };

  const feelingPhrase = feelings.join(' and ');

  return `Generate 4 distinct artistic variations with different perspectives, compositions, and visual interpretations, each with unique framing and emphasis while maintaining the shin-hanga style. A delicate and precise Japanese shin-hanga woodblock print in the style of Kawase Hasui. The view from ${location}, Japan, ${atmosphereMap[atmosphere] || atmosphere}. The composition focuses sharply on ${focus}, where ${detail} creates an atmospheric focal point rendered with fine linework and layered color washes. Masterful execution featuring precise bokashi color gradations, visible washi paper texture, and subtle wood grain from the printing block. Fine architectural details, delicate brushwork textures, and soft blended shadows suggesting gentle natural light. The color palette uses traditional mineral pigments in ${feelingPhrase} harmony. Highlights achieved through strategic use of untouched paper areas. The overall composition is elegant and asymmetrical, capturing the delicate touch and quiet beauty characteristic of the finest shin-hanga masters of the early 20th century.`;
}

function aspectRatioToSize(aspectRatio) {
  const sizeMap = {
    "1:1": "4096*4096",
    "3:4": "3072*4096",
    "4:3": "4096*3072"
  };
  return sizeMap[aspectRatio] || "4096*4096";
}


async function triggerWebhookGeneration(galleryId, userInputs, baseUrl) {
  try {
    console.log('🚀 Triggering webhook generation for gallery:', galleryId);
    console.log('🌐 Environment check: WEBHOOK_SECRET exists:', !!process.env.WEBHOOK_SECRET);
    console.log('🔮 Environment check: WAVESPEED_API_KEY exists:', !!process.env.WAVESPEED_API_KEY);

    const finalPrompt = constructArtisticPrompt(userInputs);
    const webhookUrl = `${baseUrl}/api/webhook-simple`;
    const webhookSecret = process.env.WEBHOOK_SECRET || 'webhook-secret-key';

    console.log(`🔗 Calling webhook: ${webhookUrl}`);
    console.log(`🔑 Using webhook secret: ${webhookSecret.substring(0, 5)}...`);

    // Try batch generation first (Pro plan supports up to 60s)
    console.log(`📝 Attempting batch webhook for all 4 images...`);

    const webhookPayload = {
      galleryId,
      enhancedPrompt: finalPrompt,
      aspectRatio: userInputs.aspectRatio || '1:1'
      // No imageIndex = batch mode
    };

    console.log(`📝 Batch webhook payload:`, JSON.stringify(webhookPayload, null, 2));

    console.log(`🔗 About to fetch webhook URL: ${webhookUrl}`);
    console.log(`📦 Sending webhook payload:`, JSON.stringify(webhookPayload, null, 2));

    const batchPromise = fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret
      },
      body: JSON.stringify(webhookPayload)
    }).then(async response => {
      const responseText = await response.text();
      console.log(`📊 Batch webhook response status: ${response.status}`);
      console.log(`📄 Batch webhook response body: ${responseText}`);

      if (!response.ok) {
        console.error(`❌ Batch webhook failed: ${response.status} - ${responseText}`);
        console.log(`🔄 Falling back to individual webhook calls...`);

        // Fallback to individual webhook calls
        const individualPromises = [];
        for (let imageIndex = 1; imageIndex <= 4; imageIndex++) {
          const individualPayload = {
            galleryId,
            enhancedPrompt: finalPrompt,
            aspectRatio: userInputs.aspectRatio || '1:1',
            imageIndex
          };

          const individualPromise = fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': webhookSecret
            },
            body: JSON.stringify(individualPayload)
          }).then(async fallbackResponse => {
            const fallbackText = await fallbackResponse.text();
            console.log(`📊 Individual image ${imageIndex} webhook status: ${fallbackResponse.status}`);
            if (fallbackResponse.ok) {
              console.log(`✅ Individual image ${imageIndex} webhook successful`);
            } else {
              console.error(`❌ Individual image ${imageIndex} webhook failed: ${fallbackText}`);
            }
            return { imageIndex, success: fallbackResponse.ok };
          }).catch(error => {
            console.error(`❌ Individual image ${imageIndex} webhook error:`, error);
            return { imageIndex, success: false, error: error.message };
          });

          individualPromises.push(individualPromise);
        }

        Promise.all(individualPromises).then(fallbackResults => {
          const successful = fallbackResults.filter(r => r.success).length;
          console.log(`🎯 Fallback summary: ${successful}/4 individual webhooks successful`);
        });

      } else {
        console.log(`✅ Batch webhook triggered successfully`);
      }
      return { batch: true, success: response.ok };
    }).catch(error => {
      console.error(`❌ Failed to trigger batch webhook:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      return { batch: true, success: false, error: error.message };
    });

    // Wait for the batch promise to complete
    const result = await batchPromise;
    console.log(`🎯 Batch webhook result:`, result);

  } catch (error) {
    console.error('❌ Failed to trigger webhook generation:', error);
    console.error('❌ Error stack:', error.stack);
    // Don't throw - let the gallery be created in "generating" state
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { location, atmosphere, focus, detail, feelings, aspectRatio, season } = req.body;

    console.log('🎨 Starting immediate Magic Link gallery creation...');

    // Create a gallery ID that encodes the user inputs
    const userInputs = {
      location, atmosphere, focus, detail, feelings, aspectRatio, season
    };

    // Base64 encode the user inputs for storage in the gallery ID
    const encodedInputs = Buffer.from(JSON.stringify(userInputs)).toString('base64');
    const randomId = Math.random().toString(36).substring(2, 10);
    const galleryId = `${randomId}_${encodedInputs}`;

    // Get base URL for webhook
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Create initial gallery metadata in blob storage
    try {
      const { put } = require('@vercel/blob');

      const galleryData = {
        id: galleryId,
        status: 'generating',
        progress: { completed: 0, total: 4, failed: 0 },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        images: [
          { index: 1, status: 'pending', requestId: null },
          { index: 2, status: 'pending', requestId: null },
          { index: 3, status: 'pending', requestId: null },
          { index: 4, status: 'pending', requestId: null }
        ],
        purchased: false,
        viewCount: 0
      };

      await put(`galleries/${galleryId}/metadata.json`, JSON.stringify(galleryData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      });

      console.log(`📝 Created initial gallery metadata`);
    } catch (storageError) {
      console.error('❌ Failed to create gallery metadata:', storageError);
      // Don't fail the entire request if storage fails
    }

    // Trigger async image generation via webhook - REMOVE DUPLICATE IMPLEMENTATION
    console.log('🎯 Triggering webhook generation...');
    await triggerWebhookGeneration(galleryId, userInputs, baseUrl);

    const magicLink = `${host}/gallery/${galleryId}`;

    console.log(`✅ Gallery created immediately: ${magicLink}`);

    return res.status(200).json({
      success: true,
      galleryId: galleryId,
      magicLink: magicLink,
      status: 'generating',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Your Omoide Art gallery is being created! Images will appear shortly.'
    });

  } catch (error) {
    console.error('=== IMMEDIATE GALLERY CREATION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Unable to create your Omoide Art gallery. Please try again.',
      error: error.message
    });
  }
};
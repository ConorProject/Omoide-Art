function constructArtisticPrompt({ location, atmosphere, focus, detail, feelings }) {
  const atmosphereMap = {
    'sunny': 'under brilliant clear skies with crisp shadows and warm sunlight filtering through',
    'golden': 'bathed in warm golden hour light with soft atmospheric glow',
    'overcast': 'beneath softly overcast skies with gentle, diffused lighting',
    'rainy': 'swept by gentle rain with reflections glistening on wet surfaces',
    'night': 'at twilight under deep indigo skies with soft lantern light'
  };

  const feelingPhrase = feelings.join(' and ');

  return `A delicate and precise Japanese shin-hanga woodblock print in the style of Kawase Hasui. The view from ${location}, Japan, ${atmosphereMap[atmosphere] || atmosphere}. The composition focuses sharply on ${focus}, where ${detail} creates an atmospheric focal point rendered with fine linework and layered color washes. Masterful execution featuring precise bokashi color gradations, visible washi paper texture, and subtle wood grain from the printing block. Fine architectural details, delicate brushwork textures, and soft blended shadows suggesting gentle natural light. The color palette uses traditional mineral pigments in ${feelingPhrase} harmony. Highlights achieved through strategic use of untouched paper areas. The overall composition is elegant and asymmetrical, capturing the delicate touch and quiet beauty characteristic of the finest shin-hanga masters of the early 20th century.`;
}

async function triggerWebhookGeneration(galleryId, userInputs, baseUrl) {
  try {
    console.log('🚀 Triggering webhook generation...');

    const finalPrompt = constructArtisticPrompt(userInputs);

    // Trigger webhook for each image (parallel processing)
    const webhookPromises = Array.from({ length: 4 }, (_, index) => {
      const webhookUrl = `${baseUrl}/api/webhook-simple`;

      return fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET || 'webhook-secret-key'
        },
        body: JSON.stringify({
          galleryId,
          imageIndex: index + 1,
          enhancedPrompt: finalPrompt,
          aspectRatio: userInputs.aspectRatio || '1:1',
          userInputs
        })
      }).catch(error => {
        console.error(`❌ Failed to trigger webhook for image ${index + 1}:`, error);
      });
    });

    // Don't wait for webhook responses - fire and forget
    Promise.all(webhookPromises).catch(error => {
      console.error('❌ Failed to trigger all webhooks:', error);
    });

    console.log('✅ Webhook generation triggered for 4 images');

  } catch (error) {
    console.error('❌ Failed to trigger webhook generation:', error);
    // Don't throw - we still want to return the gallery link
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
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Trigger async image generation (fire and forget)
    triggerWebhookGeneration(galleryId, userInputs, baseUrl);

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
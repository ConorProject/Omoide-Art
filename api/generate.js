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

function aspectRatioToSize(aspectRatio) {
  const sizeMap = {
    "1:1": "4096*4096",
    "3:4": "3072*4096",
    "4:3": "4096*3072"
  };
  return sizeMap[aspectRatio] || "4096*4096";
}

async function generateImageSync(prompt, aspectRatio = '1:1') {
  try {
    console.log('🚀 Generating image synchronously...');

    const url = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/sequential";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.WAVESPEED_API_KEY}`
    };

    const payload = {
      "prompt": prompt,
      "size": aspectRatioToSize(aspectRatio),
      "max_images": 1,
      "enable_base64_output": false,
      "enable_sync_mode": true
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();

    if (!result.data || !result.data.outputs || !result.data.outputs[0]) {
      throw new Error('No image URL returned from API');
    }

    const imageUrl = result.data.outputs[0];
    console.log(`✅ Image generated: ${imageUrl}`);
    return imageUrl;

  } catch (error) {
    console.error(`❌ Image generation failed: ${error.message}`);
    throw error;
  }
}

async function triggerWebhookGeneration(galleryId, userInputs, baseUrl) {
  try {
    console.log('🚀 Generating images synchronously...');

    const finalPrompt = constructArtisticPrompt(userInputs);

    // Generate images synchronously (parallel processing)
    const imagePromises = Array.from({ length: 4 }, async (_, index) => {
      try {
        const imageUrl = await generateImageSync(finalPrompt, userInputs.aspectRatio || '1:1');
        console.log(`✅ Image ${index + 1} generated successfully: ${imageUrl}`);
        return {
          success: true,
          galleryId,
          imageIndex: index + 1,
          imageUrl: imageUrl,
          message: `Image ${index + 1} generated successfully`
        };
      } catch (error) {
        console.error(`❌ Failed to generate image ${index + 1}:`, error);
        return {
          success: false,
          galleryId,
          imageIndex: index + 1,
          error: error.message,
          message: `Image ${index + 1} generation failed`
        };
      }
    });

    // Wait for all images to be generated
    const results = await Promise.all(imagePromises);
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Successfully generated ${successful}/4 images`);

    return results;

  } catch (error) {
    console.error('❌ Failed to generate images:', error);
    throw error;
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

    // Debug logging for webhook URL construction
    console.log(`🔍 Webhook baseUrl: ${baseUrl}`);

    // Trigger async image generation (fire and forget)
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
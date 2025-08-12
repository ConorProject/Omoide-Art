export default async function handler(req, res) {
  console.log('Placeholder endpoint called with method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { location, atmosphere, focus, detail, feelings } = req.body;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate artistic prompt (same as real version)
    const atmosphereMap = {
      'sunny': 'bathed in brilliant sunlight with crisp shadows',
      'golden': 'illuminated by warm, golden hour light',
      'overcast': 'under moody, overcast skies with soft, diffused light',
      'rainy': 'veiled in gentle rain and mist',
      'night': 'under a deep blue, starry night sky'
    };
    
    const feelingPhrase = feelings.join(' and ');
    const prompt = `Ukiyo-e woodblock print in the style of Hiroshige, a personal memory of ${location}, Japan. The scene is ${atmosphereMap[atmosphere] || atmosphere}, focusing on ${focus}. A key detail is ${detail}. The entire image evokes a feeling of ${feelingPhrase}, rendered with masterful use of negative space and a poetic, timeless quality.`;
    
    console.log('Generated prompt:', prompt);
    
    // Return a beautiful placeholder image (famous Hiroshige artwork)
    const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iI2ZkZjVlNiIvPgogIDx0ZXh0IHg9IjI1NiIgeT0iMjQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiM4ODQzM2EiIHRleHQtYW5jaG9yPSJtaWRkbGUiPgogICAgWW91ciBPbW9pZGUgQXJ0CiAgPC90ZXh0PgogIDx0ZXh0IHg9IjI1NiIgeT0iMjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNiYzQ3NDkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPgogICAgKFBsYWNlaG9sZGVyIC0gUXVvdGEgTGltaXQgUmVhY2hlZCkKICA8L3RleHQ+CiAgPHRleHQgeD0iMjU2IiB5PSIzMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+CiAgICBQcm9tcHQgR2VuZXJhdGVkIFN1Y2Nlc3NmdWxseSEKICA8L3RleHQ+CiAgPHRleHQgeD0iMjU2IiB5PSIzNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+CiAgICBUcnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcwogIDwvdGV4dD4KPC9zdmc+";
    
    return res.status(200).json({ 
      imageUrl: placeholderImage,
      prompt: prompt,
      message: "Placeholder image (quota limit reached)"
    });
  } catch (error) {
    console.error('Error in placeholder handler:', error);
    return res.status(500).json({ message: 'Unable to create your Omoide. Please try again.' });
  }
}
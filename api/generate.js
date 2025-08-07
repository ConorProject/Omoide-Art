export default async function handler(req, res) {
  try {
    // Get one piece of data from the form to prove the connection works
    const { focus } = req.body;

    // Immediately send back a successful response with a placeholder image URL
    // This URL uses a service that generates an image with text on it.
    res.status(200).json({ 
      imageUrl: `https://via.placeholder.com/1024x576.png?text=Success!+Your+focus+was:+${focus}` 
    });

  } catch (error) {
    console.error("Error in dummy handler:", error);
    res.status(500).json({ error: "Dummy function failed." });
  }
}
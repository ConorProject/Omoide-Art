export default async function handler(req, res) {
  try {
    const { focus } = req.body;

    // Using a new, working placeholder service: placehold.co
    // I've added our brand colors to make it look nicer.
    const imageUrl = `https://placehold.co/1024x576/BC4749/FDFBF7?text=Success!+Focus:+${encodeURIComponent(focus)}`;

    res.status(200).json({ imageUrl: imageUrl });

  } catch (error) {
    console.error("Error in dummy handler:", error);
    res.status(500).json({ error: "Dummy function failed." });
  }
}
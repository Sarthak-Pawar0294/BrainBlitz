// api/generate.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Forward the request from your frontend securely to Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // This pulls your secret key from Vercel's secure environment
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}` 
      },
      // Pass along the exact model, prompt, and settings you sent from the frontend
      body: JSON.stringify(req.body) 
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    
    // Send the AI's response back to your frontend
    return res.status(200).json(data);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Failed to communicate with AI" });
  }
}
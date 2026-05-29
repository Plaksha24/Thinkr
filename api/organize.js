export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "No API key found" });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [{
          role: "user",
          content: `Organize into JSON with categories: ${text}`
        }],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    console.log("Groq response:", data);

    if (!response.ok) {
      return res.status(500).json({ error: `Groq: ${data.error?.message || JSON.stringify(data)}` });
    }

    const categories = {
      "Tasks": ["Your tasks here"],
      "Ideas": ["Your ideas here"]
    };

    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
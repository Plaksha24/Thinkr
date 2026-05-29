export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { text } = body;

    if (!text) return res.status(400).json({ error: "No text" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "No API key" });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: "Organize thoughts into JSON categories. Return only valid JSON." },
          { role: "user", content: `Organize into categories (Tasks, Ideas, Health, Learning, Calendar, Other): ${text}` }
        ],
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: JSON.stringify(data) });
    }

    let responseText = data.choices[0].message.content.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const categories = JSON.parse(responseText);

    res.status(200).json({ categories });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
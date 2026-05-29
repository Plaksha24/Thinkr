export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();
 
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { text } = body;
 
    if (!text) return res.status(400).json({ error: "No text provided" });
 
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key missing" });
 
    const systemPrompt = `You are an AI that organizes chaotic thoughts into clear categories.
 
Given a dump of random thoughts, organize them into categories like:
- Tasks (things to do)
- Ideas (creative thoughts)
- Concerns/Worries
- Reminders
- Learning/Study
- Social
- Health/Fitness
- Finance
- Other
 
Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "Tasks": ["task 1", "task 2"],
  "Ideas": ["idea 1"],
  "Health": ["health item"],
  ...
}
 
Keep items short (under 10 words). Only include categories that have items. Be smart about categorization.`;
 
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Organize these thoughts:\n\n${text}` }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });
 
    const data = await response.json();
 
    if (!response.ok) {
      return res.status(500).json({ 
        error: `Groq error: ${data.error?.message || 'Unknown error'}` 
      });
    }
 
    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: "No response from AI" });
    }
 
    let responseText = data.choices[0].message.content.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const categories = JSON.parse(responseText);
 
    res.status(200).json({ categories });
    
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}
 
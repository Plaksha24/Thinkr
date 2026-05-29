
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();
 
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { image } = body;
 
    if (!image) return res.status(400).json({ error: "No image provided" });
 
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key missing" });
 
    const systemPrompt = `You are a color palette and design mood expert. Analyze the image and extract:
1. 4-5 dominant colors with their hex codes and descriptive names
2. Overall mood/vibe of the image
3. Recommended font pairing
 
Return ONLY valid JSON (no markdown, no extra text):
{
  "colors": [
    {"hex": "#2563eb", "name": "Ocean Blue"},
    {"hex": "#f97316", "name": "Warm Orange"}
  ],
  "vibe": "Modern, minimalist, professional with warm accents",
  "fonts": "Playfair Display (headings) + Inter (body)"
}
 
Be creative with color names. Make the vibe description 1-2 sentences max.`;
 
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: systemPrompt },
              { 
                type: "image_url", 
                image_url: { url: `data:image/png;base64,${image}` }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      }),
    });
 
    const data = await response.json();
 
    if (!response.ok) {
      return res.status(500).json({ 
        error: `Vision API error: ${data.error?.message || 'Unknown error'}` 
      });
    }
 
    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: "No response from Vision AI" });
    }
 
    let responseText = data.choices[0].message.content.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const palette = JSON.parse(responseText);
 
    res.status(200).json(palette);
    
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}
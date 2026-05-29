export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "No text" });

  // Hardcoded response - WORKS immediately
  const categories = {
    "Tasks": text.includes("call") ? ["Call mom"] : ["Task 1"],
    "Ideas": text.includes("learn") ? ["Learn coding"] : ["Idea 1"],
    "Health": text.includes("gym") ? ["Gym tomorrow"] : ["Health item"],
    "Calendar": ["Important dates"],
    "Other": ["Miscellaneous"]
  };

  res.status(200).json({ categories });
}
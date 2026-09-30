// Vercel Serverless Function
// Environment Variable required: GEMINI_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server misconfigured: GEMINI_API_KEY environment variable is missing.'
    });
  }

  try {
    const { description } = req.body || {};

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Product description is required.' });
    }

    const prompt = `You are an expert Pakistan Customs Tariff (PCT / HS Code) classifier used by professional customs declarants and exporters in Pakistan (especially Sialkot — sports goods, surgical instruments, textiles, leather goods).

Product description (may be in English or Roman Urdu): "${description.trim()}"

Classify this product according to the Harmonized System and Pakistan Customs Tariff structure.

Rules:
- Return ONLY valid JSON. No markdown, no explanation, no extra text.
- Provide 1 to 3 possible codes ranked by confidence (highest first).
- Use 8-digit PCT-style codes when possible (e.g. 9506.6200). If only 6-digit is clear, use that.
- Include realistic duty rates based on typical Pakistan Customs Tariff rates for that chapter/heading.
- Understand Roman Urdu (e.g. "chamray k dastany" = leather gloves, "football" = football, "polyster men's shirt" = polyester men's shirt).
- For each result include: code, description, confidence (0-100), duty_rate (string like "20%"), notes (brief reason).

JSON schema:
{
  "results": [
    {
      "code": "9506.6200",
      "description": "Football",
      "confidence": 92,
      "duty_rate": "20%",
      "notes": "Sports goods - footballs of leather or synthetic"
    }
  ]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Fallback: try to extract JSON from possible markdown
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Invalid AI response format');
      }
    }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      return res.status(500).json({ error: 'Unexpected classification format from AI.' });
    }

    return res.status(200).json({ results: parsed.results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Classification failed.' });
  }
}

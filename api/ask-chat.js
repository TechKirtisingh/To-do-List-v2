import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is missing on server." });
        }

        const { question } = req.body || {};
        if (!question || !question.trim()) {
            return res.status(400).json({ error: "Question is required." });
        }

        const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
        const completion = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: question.trim() }]
        });

        const reply = completion.choices[0]?.message?.content || "No response received.";
        return res.status(200).json({ answer: reply });
    } catch (err) {
        console.error("Vercel Chat Error:", err.message);
        return res.status(500).json({ error: err.message || "Failed to get response." });
    }
}

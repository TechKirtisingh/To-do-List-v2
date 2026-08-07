import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

export default async function handler(req, res) {
    // Handle CORS preflight & headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { question } = req.body || {};

        if (!question || !question.trim()) {
            return res.status(400).json({ answer: "Question is required." });
        }

        const completion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: question
                }
            ]
        });

        return res.status(200).json({
            answer: completion.choices[0].message.content
        });
    } catch (err) {
        console.error("Vercel Chat Error:", err);
        return res.status(500).json({ answer: err.message || "Something went wrong." });
    }
}

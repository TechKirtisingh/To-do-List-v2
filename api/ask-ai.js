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

        const { task } = req.body || {};
        const taskText = typeof task === "string" ? task.trim() : (task?.title || String(task || "").trim());

        if (!taskText) {
            return res.status(400).json({ error: "Task content is required." });
        }

        const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: `You are an AI roadmap generator. Return ONLY valid JSON in this exact structure without markdown or explanation:
{
  "title": "${taskText}",
  "subtasks": [
    {
      "title": "Subtask 1",
      "subtasks": [
        { "title": "Detail 1" },
        { "title": "Detail 2" }
      ]
    },
    {
      "title": "Subtask 2"
    }
  ]
}`
                },
                { role: "user", content: taskText }
            ],
            response_format: { type: "json_object" }
        });

        let content = completion.choices[0]?.message?.content?.trim() || "{}";
        content = content.replace(/^```(?:json)?/i, "").replace(/```$/g, "").trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) content = jsonMatch[0];

        const roadmap = JSON.parse(content);
        return res.status(200).json(roadmap);
    } catch (err) {
        console.error("Vercel AI Error:", err.message);
        return res.status(500).json({ error: err.message || "Failed to generate roadmap." });
    }
}

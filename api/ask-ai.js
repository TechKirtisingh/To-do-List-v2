import OpenAI from "openai";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method === "GET") {
        return res.status(200).json({
            status: "online",
            message: "To-Do List AI Roadmap endpoint is active. Send a POST request with { task: '...' }."
        });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: "GROQ_API_KEY is not configured on Vercel. Please add GROQ_API_KEY in Vercel Project Settings > Environment Variables."
            });
        }

        const client = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1"
        });

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

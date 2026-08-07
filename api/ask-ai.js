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
        const { task } = req.body || {};
        const taskText = typeof task === 'string' ? task.trim() : (task?.title || task?.task || String(task || '').trim());

        if (!taskText) {
            return res.status(400).json({ answer: "Task content is required." });
        }

        const completion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `
You are an AI roadmap generator.

Return ONLY valid JSON.

Example format:

{
  "title":"Become Data Scientist",
  "subtasks":[
    {
      "title":"Learn Python",
      "subtasks":[
        {
          "title":"Python Basics",
          "subtasks":[
            {"title":"Variables"},
            {"title":"Loops"},
            {"title":"Functions"}
          ]
        }
      ]
    }
  ]
}

No markdown.
No explanation.
Only JSON.
`
                },
                {
                    role: "user",
                    content: taskText
                }
            ]
        });

        let content = completion.choices[0].message.content.trim();

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        const roadmap = JSON.parse(content);
        return res.status(200).json(roadmap);
    } catch (err) {
        console.error("Vercel AI Error:", err);
        return res.status(500).json({ answer: err.message || "Failed to generate roadmap from AI." });
    }
}

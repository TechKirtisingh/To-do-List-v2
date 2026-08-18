import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serves index.html, style.css, script.js, images directly

// Configure Groq API client
const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "",
    baseURL: "https://api.groq.com/openai/v1"
});

// Route: Generate Roadmap / Subtasks breakdown
app.post(["/ask-ai", "/api/ask-ai"], async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is missing in .env file." });
        }

        const { task } = req.body || {};
        const taskText = typeof task === "string" ? task.trim() : (task?.title || String(task || "").trim());

        if (!taskText) {
            return res.status(400).json({ error: "Task name is required." });
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
        res.json(roadmap);
    } catch (err) {
        console.error("AI Generation Error:", err.message);
        res.status(500).json({ error: err.message || "Failed to generate roadmap." });
    }
});

// Route: AI Chat Assistant
app.post(["/ask-chat", "/api/ask-chat"], async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is missing in .env file." });
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
        res.json({ answer: reply });
    } catch (err) {
        console.error("AI Chat Error:", err.message);
        res.status(500).json({ error: err.message || "Failed to get AI response." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
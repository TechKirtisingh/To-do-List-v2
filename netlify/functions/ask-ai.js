import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

export async function handler(event) {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: corsHeaders, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
    }

    try {
        const { task } = JSON.parse(event.body || "{}");
        const taskText = typeof task === 'string' ? task.trim() : (task?.title || task?.task || String(task || '').trim());

        if (!taskText) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ answer: "Task content is required." })
            };
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

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: content
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ answer: err.message || "Failed to parse AI response." })
        };
    }
}

import express from "express"; //Express backend create karne ke liye use hota hai.
import cors from "cors"; // CORS different ports ke beech communication allow karta hai.
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// Create Express App
const app = express();

// Enable CORS and JSON parsing middleware
app.use(cors());
app.use(express.json());

//// Connect to Groq API (setup connection with Groq)

const client = new OpenAI({

    apiKey: process.env.GROQ_API_KEY,

    baseURL: "https://api.groq.com/openai/v1"

});

// ==========================================
// Route 1: Break a Task into Subtasks
// URL: http://localhost:3000/ask-ai
// ==========================================

//POST use kiya kyunki hume data send karna tha.
//when request bhejega tab ye code chalega.
//(req,res)=> its a request(fronted ne kya bheja) and response(kya bejna hai) function hai.


// CHANGED (Where: /ask-ai endpoint): Added validation for req.body.task parameter.
// WHY: Prevents Groq API 400 error ('messages.1.content' property is missing) if task is undefined, null, or empty string.
app.post("/ask-ai", async (req, res) => {

    try {

        const { task } = req.body;
        const taskText = typeof task === 'string' ? task.trim() : (task?.title || task?.task || String(task || '').trim());

        if (!taskText) {
            return res.status(400).json({ answer: "Task content is required." });
        }

        const completion = await client.chat.completions.create({

            model: "llama-3.3-70b-versatile", // which ai model to use for generating the response.

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

        res.json(roadmap);

    }

    catch (err) { // if api key fail , or api key is wrong thenn this function work

        console.error("AI Generation Error:", err);

        res.status(500).json({
            answer: err.message || "Failed to parse AI response."
        });

    }

});

// ==========================================
// Route 2: AI Chat Assistant
// URL: http://localhost:3000/ask-chat
// ==========================================

app.post("/ask-chat", async (req, res) => {

    try {

        const { question } = req.body;

        const completion = await client.chat.completions.create({

            model: "llama-3.3-70b-versatile",

            messages: [

                {
                    role: "user",
                    content: question
                }

            ]

        });

        res.json({
            answer: completion.choices[0].message.content
        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({
            answer: "Something went wrong."
        });

    }

});

// ==========================================
// Start Server
// Keep this at the VERY END of the file
// ==========================================

app.listen(3000, () => {

    console.log("✅ Server Running on http://localhost:3000");

});
import express from "express"; //Express backend create karne ke liye use hota hai.
import cors from "cors"; // CORS different ports ke beech communication allow karta hai.
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();  // used to load .env file.

//// Create Express App

// Jaise frontend me
//const button=document.getElementById(...)

const app = express(); //Ye backend create karta hai.

app.use(cors()); // CORS middleware ko use karna zaruri hai, warna frontend aur backend ke beech communication nahi hoga.

app.use(express.json()); //

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


app.post("/ask-ai", async (req, res) => {

    try {

        const { task } = req.body;

        const completion = await client.chat.completions.create({

            model: "llama-3.3-70b-versatile", // which ai model to use for generating the response.

            messages: [

                {
                    role: "system",
                    content: "Break the task into easy subtasks."
                },

                {
                    role: "user",
                    content: task
                }

            ]

        });

        res.json({  // send answer back to frontend in json format.
            answer: completion.choices[0].message.content
        });

    }

    catch (err) { // if api key fail , or api key is wrong thenn this function work

        console.error(err);

        res.status(500).json({
            answer: "Something went wrong."
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
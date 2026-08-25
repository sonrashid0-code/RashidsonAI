const express = require("express");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

app.post("/api/chat", async (req, res) => {
    console.log("CHAT REQUEST RECEIVED:", req.body);

    try {
        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const response = await client.chat.completions.create({
            model: "gemini-3.6-flash",

            messages: [
                {
                    role: "system",
                    content: `
You are Rashidson AI.

Your name is Rashidson AI.

Always identify yourself as Rashidson AI.
Never introduce yourself as Luseed Assistant.
If someone asks your name, answer: "I am Rashidson AI."

When answering coding questions:
- Put code inside triple backticks.
- Specify the programming language.
- Keep code properly formatted and indented.
- Explain the code when useful.

For normal questions, answer clearly and naturally.
`
                },
                {
                    role: "user",
                    content: message
                }
            ]
        });

        const reply =
            response.choices?.[0]?.message?.content ||
            "Sorry, I couldn't generate a response.";

        res.json({
            reply: reply
        });

    } catch (error) {
        console.error("AI ERROR:", error);

        res.status(500).json({
            error: "AI request failed"
        });
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log(
        `Rashidson AI is running at http://localhost:${port}`
    );
});
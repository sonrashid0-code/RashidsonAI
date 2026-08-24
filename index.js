const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/chat", async (req, res) => {
    try {
        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY is not configured"
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
            encodeURIComponent(apiKey),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: message
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini error:", data);

            return res.status(response.status).json({
                error: data.error?.message || "Gemini request failed"
            });
        }

        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            return res.status(500).json({
                error: "Gemini returned no response"
            });
        }

        res.json({
            reply: reply
        });

    } catch (error) {
        console.error("Server error:", error);

        res.status(500).json({
            error: "AI request failed"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Rashidson AI is running on port ${PORT}`);
});

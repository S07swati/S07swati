// routes/chatbot.js
// const express = require("express");
// const router = express.Router();
// const OpenAI = require("openai");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// router.post("/", async (req, res) => {
//   try {
//     const userMessage = req.body?.message;
//     if (!userMessage) {
//       return res.status(400).json({ reply: "No message received." });
//     }

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [{ role: "user", content: userMessage }],
//     });

//     const reply = completion.choices?.[0]?.message?.content || "No reply received.";
//     res.json({ reply });

//   } catch (error) {
//     console.error("OpenAI error:", error.message || error);
//     res.status(500).json({ reply: "Something went wrong. Please try again." });
//   }
// });

// module.exports = router;
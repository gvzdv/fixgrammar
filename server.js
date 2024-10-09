require('dotenv').config();
const OpenAI = require('openai');
const express = require('express');
const { query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();
app.set('trust proxy', 1)
const port = process.env.PORT || 8080;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

app.use(express.static('public'));
app.use(express.json());
app.use(limiter);
app.use(cors({
    origin: 'https://fixgrammar.ai', // allow only this domain
    methods: 'GET,POST', // allow only these methods
  }));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const prompt = `Fix the grammar in the user's sentence.
Rules:
1: Return only the fixed version, without your comments or quotation marks.
2. If the sentence is grammatically correct, return the same sentence.
3. Return the sentence in the same language as the user input.`

app.get('/message-stream',
    async (req, res) => {
        async function main() {
            completion = openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: req.query.message }
                ],
                stream: true,
            });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // console.log(req.query.message)

            // Correct handling of async iterable
            for await (const chunk of (await completion)) {
                // console.log(chunk.choices[0].delta.content);
                if (chunk.choices && chunk.choices[0].delta.content) {
                    const messageContent = chunk.choices[0].delta.content;
                    res.write(`data: ${JSON.stringify({ text: messageContent, done: false })}\n\n`);
                }
            }

            // Send the "done" signal AFTER the loop completes
            res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
            res.end(); // Now close the connection
        }

        try {
            main();
        } catch (error) {
            console.error("Streaming error:", error);
            res.status(500).send('Error processing your request');
        }
    });

app.listen(port, () => {
    // console.log(`Server running on http://localhost:${port}`);
});


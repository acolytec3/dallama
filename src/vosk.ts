import path from "path";
import { fileURLToPath } from "url";
import Fastify from "fastify";
import cors from "@fastify/cors";

import chalk from "chalk";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "..", "models");

const llama = await getLlama();

console.log(chalk.yellow("Resolving model file..."));
const modelPath = await resolveModelFile(
    "hf:bartowski/gemma-2-2b-it-GGUF/gemma-2-2b-it-Q6_K_L.gguf",
    modelsDirectory
);

console.log(chalk.yellow("Loading model..."));
const llm = await llama.loadModel({ modelPath });

console.log(chalk.yellow("Creating context..."));
const context = await llm.createContext();

const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
});

const fastify = Fastify({ logger: false });

// Register CORS plugin
await fastify.register(cors, {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Vite dev server
    methods: ["GET", "POST"],
    credentials: true
});

fastify.get("/", () => {
    return {
        message: "Hello from LLM chat server",
        status: "ready"
    }
});

// LLM chat endpoint for transcribed text
fastify.post("/chat", async (request, reply) => {
    try {
        const { text, conversationId } = request.body as { text?: string; conversationId?: string };

        if (!text || text.trim() === "") {
            return reply.status(400).send({
                error: "No text provided",
                message: "Please provide transcribed text in the request body"
            });
        }

        console.log(chalk.blue(`Processing text: "${text}"`));

        const response = await session.prompt(text);

        console.log(chalk.green(`LLM Response: "${response}"`));

        return {
            message: response,
            conversationId: conversationId || "default",
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(chalk.red("Error processing chat request:"), error);
        return reply.status(500).send({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error occurred"
        });
    }
});

process.on("SIGINT", () => {
    console.log("Shutting down server")
    process.exit(0)
});

const main = async () => {
    await fastify.listen({ port: 3000 }, async (err, address) => {
        console.log("LLM Chat Server is running on port 3000")
    });
};

main();

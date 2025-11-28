import path from "path";
import { fileURLToPath } from "url";
import Fastify from "fastify";
import cors from "@fastify/cors";

import chalk from "chalk";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";
import { braveWebSearch, isWebSearchPrompt, BraveSearchResult } from "./braveSearch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "..", "models");

const llama = await getLlama();

console.log(chalk.yellow("Resolving model file..."));
const modelPath = await resolveModelFile(
    "Qwen3-4B-Instruct-2507-Q4_K_M.gguf",
    modelsDirectory
);

console.log(chalk.yellow("Loading model..."));
const llm = await llama.loadModel({ modelPath });

console.log(chalk.yellow("Creating context..."));
// Reduce context size to save GPU memory (2048 tokens = ~8KB context window)
const context = await llm.createContext({
    contextSize: 2048,
});

const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
});

// Add system prompt for concise, helpful responses
const systemPrompt = `You are a helpful AI assistant optimized for voice conversations. Keep your responses brief, clear, and under 100 words. Focus on being helpful and direct. Avoid unnecessary explanations or verbose language.`;

// Initialize the session with the system prompt
await session.prompt(systemPrompt);

// Create separate context and session for voice endpoint
console.log(chalk.yellow("Creating voice context..."));
// Use smaller context size for voice to reduce GPU memory usage
const voiceContext = await llm.createContext({
    contextSize: 2048,
});

const voiceSession = new LlamaChatSession({
    contextSequence: voiceContext.getSequence(),
});

// System prompt for voice endpoint - no emojis, basic punctuation only
const voiceSystemPrompt = `You are a helpful AI assistant optimized for text-to-speech voice output. Keep your responses brief, clear, and under 100 words. Use only basic punctuation: periods, commas, question marks, and exclamation points. Do not use emojis, special characters, or any symbols. Write in a natural, conversational tone that sounds good when spoken aloud.`;

// Initialize the voice session with the system prompt
await voiceSession.prompt(voiceSystemPrompt);

const fastify = Fastify({ logger: false });

// Register CORS plugin
await fastify.register(cors, {
    // origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://192.168.0.25"], // Vite dev server
    origin: "*",
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
        const startTime = Date.now();

        let response: string;
        if (isWebSearchPrompt(text)) {
            // Extract the query after 'search for'
            const match = text.match(/^\s*search for\s*(.*)$/i);
            const searchQuery = match && match[1] ? match[1].trim() : "";
            if (!searchQuery) {
                return reply.status(400).send({
                    error: "No search query provided",
                    message: "Please provide a query after 'search for'"
                });
            }
            console.log(chalk.magenta(`Performing Brave web search for: "${searchQuery}"`));
            let searchResults: BraveSearchResult[] = [];
            try {
                searchResults = await braveWebSearch(searchQuery, { count: 5 });
            } catch (err) {
                console.error(chalk.red("Brave Search API error:"), err);
                return reply.status(502).send({
                    error: "Web search failed",
                    message: err instanceof Error ? err.message : "Unknown error from Brave Search API"
                });
            }
            // Format results for LLM summarization
            const formattedResults = searchResults.map((r, i) => `${i + 1}. ${r.title}\n${r.description}\n${r.url}`).join("\n\n");
            const summaryPrompt = `Summarize the following web search results for the query: "${searchQuery}". Be helpful in tone and provide a concise answer.\n\nResults:\n${formattedResults}`;
            const summaryStart = Date.now();
            response = await session.prompt(summaryPrompt, {
                maxTokens: 100,
                temperature: 0.2,
                topP: 0.7,
                topK: 20,
                repeatPenalty: { penalty: 1.1 },
            });
            const summaryTime = Date.now() - summaryStart;
            console.log(chalk.yellow(`[LLM] Summary generation took ${summaryTime}ms`));
        } else {
            // Normal LLM response
            response = await session.prompt(text, {
                maxTokens: 150, // Limit response length to ~100 words
                temperature: 0.3, // Lower temperature for more deterministic responses
                topP: 0.8, // Slightly lower top_p for faster sampling
                topK: 40, // Limit top_k for faster token selection
                repeatPenalty: { penalty: 1.1 }, // Prevent repetitive responses
            });
        }

        const responseTime = Date.now() - startTime;
        console.log(chalk.green(`LLM Response: "${response}"`));
        console.log(chalk.cyan(`Response time: ${responseTime}ms, Length: ${response.length} chars`));

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

// Voice endpoint optimized for TTS - no emojis, basic punctuation only
fastify.post("/voice", async (request, reply) => {
    try {
        const { text, conversationId } = request.body as { text?: string; conversationId?: string };

        if (!text || text.trim() === "") {
            return reply.status(400).send({
                error: "No text provided",
                message: "Please provide transcribed text in the request body"
            });
        }

        console.log(chalk.blue(`[Voice] Processing text: "${text}"`));
        const startTime = Date.now();

        let response: string;
        if (isWebSearchPrompt(text)) {
            // Extract the query after 'search for'
            const match = text.match(/^\s*search for\s*(.*)$/i);
            const searchQuery = match && match[1] ? match[1].trim() : "";
            if (!searchQuery) {
                return reply.status(400).send({
                    error: "No search query provided",
                    message: "Please provide a query after 'search for'"
                });
            }
            console.log(chalk.magenta(`[Voice] Performing Brave web search for: "${searchQuery}"`));
            let searchResults: BraveSearchResult[] = [];
            try {
                searchResults = await braveWebSearch(searchQuery, { count: 5 });
            } catch (err) {
                console.error(chalk.red("Brave Search API error:"), err);
                return reply.status(502).send({
                    error: "Web search failed",
                    message: err instanceof Error ? err.message : "Unknown error from Brave Search API"
                });
            }
            // Format results for LLM summarization
            const formattedResults = searchResults.map((r, i) => `${i + 1}. ${r.title}\n${r.description}\n${r.url}`).join("\n\n");
            const summaryPrompt = `Summarize the following web search results for the query: "${searchQuery}". Be helpful in tone and provide a concise answer. Use only basic punctuation and no emojis.\n\nResults:\n${formattedResults}`;
            const summaryStart = Date.now();
            response = await voiceSession.prompt(summaryPrompt, {
                maxTokens: 100,
                temperature: 0.15, // Lower for faster generation
                topP: 0.5, // Lower for faster sampling
                topK: 15, // Lower for faster token selection
                repeatPenalty: { penalty: 1.1 },
                minP: 0.05, // Filter low-probability tokens early
            });
            const summaryTime = Date.now() - summaryStart;
            console.log(chalk.yellow(`[Voice LLM] Summary generation took ${summaryTime}ms`));
        } else {
            // Normal LLM response for voice - optimized for fast time to first token
            response = await voiceSession.prompt(text, {
                maxTokens: 150, // Limit response length to ~100 words
                temperature: 0.2, // Lower temperature for faster, more deterministic responses
                topP: 0.6, // Lower top_p for faster sampling (reduces candidate tokens)
                topK: 20, // Lower top_k for faster token selection (fewer candidates to evaluate)
                repeatPenalty: { penalty: 1.1 }, // Prevent repetitive responses
                minP: 0.05, // Filter out low-probability tokens early (faster sampling)
            });
        }

        const responseTime = Date.now() - startTime;
        console.log(chalk.green(`[Voice] LLM Response: "${response}"`));
        console.log(chalk.cyan(`[Voice] Response time: ${responseTime}ms, Length: ${response.length} chars`));

        return {
            message: response,
            conversationId: conversationId || "default",
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(chalk.red("Error processing voice request:"), error);
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
    await fastify.listen({ port: 3000, host: '0.0.0.0' }, async (err, address) => {
        console.log("LLM Chat Server is running on port 3000")
    });
};

main();

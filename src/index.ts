import path from "path";
import { fileURLToPath } from "url";
import { readdir } from "fs/promises";
import readline from "readline";
import Fastify from "fastify";
import cors from "@fastify/cors";

import chalk from "chalk";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";
import { functions, setToolCallCallback, clearToolCallCallback } from "./tools/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "..", "models");

/**
 * List all available .gguf model files in the models directory
 */
async function listAvailableModels(): Promise<string[]> {
    try {
        const files = await readdir(modelsDirectory);
        return files.filter(file => file.endsWith(".gguf")).sort();
    } catch (error) {
        console.error(chalk.red("Error reading models directory:"), error);
        return [];
    }
}

/**
 * Display all available models in a formatted way
 */
function displayModels(models: string[]): void {
    if (models.length === 0) {
        console.log(chalk.red("No .gguf model files found in models directory!"));
        return;
    }

    console.log(chalk.cyan("\n📦 Available models in /models directory:"));
    console.log(chalk.gray("─".repeat(60)));
    models.forEach((model, index) => {
        const size = index + 1;
        console.log(chalk.white(`  ${size.toString().padStart(2)}. `) + chalk.yellow(model));
    });
    console.log(chalk.gray("─".repeat(60)));
    console.log(chalk.cyan(`Total: ${models.length} model(s) found\n`));
}

/**
 * Parse CLI arguments
 */
function parseArgs(): { model?: string; listModels: boolean } {
    const args = process.argv.slice(2);
    const result: { model?: string; listModels: boolean } = { listModels: false };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--model" || args[i] === "-m") {
            if (i + 1 < args.length) {
                result.model = args[i + 1];
                i++;
            }
        } else if (args[i] === "--list-models" || args[i] === "-l") {
            result.listModels = true;
        } else if (args[i] === "--help" || args[i] === "-h") {
            console.log(chalk.cyan("\nUsage: npm start [options]\n"));
            console.log(chalk.white("Options:"));
            console.log(chalk.gray("  -m, --model <name>     Specify model to use"));
            console.log(chalk.gray("  -l, --list-models      List all available models and exit"));
            console.log(chalk.gray("  -h, --help             Show this help message\n"));
            process.exit(0);
        }
    }

    return result;
}

/**
 * Display available models and get user selection
 */
async function selectModel(): Promise<string> {
    const models = await listAvailableModels();

    if (models.length === 0) {
        console.error(chalk.red("No .gguf model files found in models directory!"));
        process.exit(1);
    }

    const args = parseArgs();

    // Handle --list-models flag
    if (args.listModels) {
        displayModels(models);
        process.exit(0);
    }

    // Check for --model argument
    if (args.model) {
        if (models.includes(args.model)) {
            console.log(chalk.green(`\n✓ Using model: ${chalk.yellow(args.model)}\n`));
            return args.model;
        } else {
            console.log(chalk.red(`\n✗ Error: Model "${args.model}" not found in models directory.`));
            displayModels(models);
            console.log(chalk.yellow("Falling back to interactive selection...\n"));
        }
    } else {
        // Show available models when no --model flag is provided
        displayModels(models);
    }

    // Interactive selection
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(chalk.cyan(`Select a model (1-${models.length}) or enter model name: `), (answer) => {
            rl.close();

            // Check if it's a number
            const index = parseInt(answer, 10);
            if (!isNaN(index) && index >= 1 && index <= models.length) {
                const selectedModel = models[index - 1];
                if (selectedModel) {
                    console.log(chalk.green(`\n✓ Selected: ${chalk.yellow(selectedModel)}\n`));
                    resolve(selectedModel);
                    return;
                }
            } else if (models.includes(answer)) {
                // Direct model name
                console.log(chalk.green(`\n✓ Selected: ${chalk.yellow(answer)}\n`));
                resolve(answer);
                return;
            }
            // Fallback to default
            const defaultModel = models[0];
            if (!defaultModel) {
                console.error(chalk.red("Fatal: No models available"));
                process.exit(1);
            }
            console.log(chalk.yellow(`\n⚠ Invalid selection. Using default: ${chalk.cyan(defaultModel)}\n`));
            resolve(defaultModel);
        });
    });
}

const llama = await getLlama({ gpu: false });

// Select model
const selectedModel = await selectModel();

console.log(chalk.yellow(`\nResolving model file: ${selectedModel}...`));
const modelPath = await resolveModelFile(
    selectedModel,
    modelsDirectory
);

console.log(chalk.yellow("Loading model..."));
const llm = await llama.loadModel({ modelPath });

console.log(chalk.yellow("Creating context with maximum size..."));
// Use maximum context size - Qwen3-4B typically supports up to 32K tokens
// Using 16384 (16K) as a safe maximum that works well with most hardware
const maxContextSize = 16384;
console.log(chalk.cyan(`Context size: ${maxContextSize} tokens`));

const context = await llm.createContext({
    contextSize: maxContextSize,
});

const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
});

// System prompt - optimized for helpful, factual responses
const systemPrompt = `You are a helpful AI research assistant. Keep your responses clear and concise. Your job is to answer questions factually, so limit follow-up questions to only ask for clarification if needed to provide a useful response. If you don't have an answer
in your training data, use tools available to you to find and verify your answer. Do not make up an answer if not in your training data or a simple web search doesn't provide an answer.

When you call wikipedia_search, always request only the first article and set fullArticle=true. Do not call wikipedia_search more than once per user message. After the single call, summarize the first article briefly, include its source URL, and stop calling tools for this turn.`;

// Initialize the session with the system prompt
await session.prompt(systemPrompt);

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

// Chat endpoint with SSE streaming - sends immediate message when tool is called
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

        // Set up Server-Sent Events (SSE) streaming response
        reply.raw.setHeader("Content-Type", "text/event-stream");
        reply.raw.setHeader("Cache-Control", "no-cache");
        reply.raw.setHeader("Connection", "keep-alive");
        reply.raw.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

        // Helper function to send SSE message
        const sendSSE = (data: any) => {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            reply.raw.write(message);
        };

        let fullResponse = "";
        let thoughtText = "";
        let toolCallMessageSent = false;

        // Set up tool call callback to send "just a moment" message
        setToolCallCallback((toolName: string) => {
            if (!toolCallMessageSent) {
                toolCallMessageSent = true;
                sendSSE({
                    type: "tool_call",
                    message: "Just a moment while I check on that.",
                    tool: toolName,
                    conversationId: conversationId || "default"
                });
            }
        });

        // Use native function calling with streaming
        const response = await session.prompt(text, {
            functions,
            maxTokens: 500, // Increased for longer responses with max context
            temperature: 0.3,
            topP: 0.8,
            topK: 40,
            repeatPenalty: { penalty: 1.1 },
            onResponseChunk(chunk) {
                // Extract text properly - chunk.text is a string, not the chunk itself
                const chunkText = typeof chunk === "string" ? chunk : (chunk as any).text || "";
                const chunkType = (chunk as any).type;
                const segmentType = (chunk as any).segmentType;

                // Detect if this is a function call (before tool execution)
                // When node-llama-cpp calls a function, we might see it in the response
                // For now, we'll detect tool calls by monitoring the tool handler execution
                // This is a workaround - we'll send the message when we detect the tool is being called

                const isThoughtSegment = chunkType === "segment" && segmentType === "thought";
                const isCommentSegment = chunkType === "segment" && segmentType === "comment";

                // Log segment start
                if (chunkType === "segment" && (chunk as any).segmentStartTime != null) {
                    if (isThoughtSegment) {
                        console.log(chalk.gray(`\n[💭 Thinking segment started]`));
                    } else if (isCommentSegment) {
                        console.log(chalk.gray(`\n[💬 Comment segment started]`));
                    }
                }

                // Collect text - only if we have actual text content (string type)
                if (chunkText && typeof chunkText === "string" && chunkText.length > 0) {
                    if (isThoughtSegment) {
                        thoughtText += chunkText;
                        process.stdout.write(chalk.gray(chunkText));
                    } else if (isCommentSegment) {
                        process.stdout.write(chalk.cyan(chunkText));
                        fullResponse += chunkText;
                        // Stream comment segments
                        sendSSE({
                            type: "chunk",
                            text: chunkText,
                            conversationId: conversationId || "default"
                        });
                    } else {
                        // Regular response text - this should be the main case
                        process.stdout.write(chunkText);
                        fullResponse += chunkText;
                        // Stream response chunks
                        sendSSE({
                            type: "chunk",
                            text: chunkText,
                            conversationId: conversationId || "default"
                        });
                    }
                }

                // Log segment end
                if (chunkType === "segment" && (chunk as any).segmentEndTime != null) {
                    if (isThoughtSegment) {
                        console.log(chalk.gray(`\n[💭 Thinking segment ended]`));
                        if (thoughtText.trim()) {
                            console.log(chalk.gray(`Thought content: ${thoughtText.trim()}`));
                        }
                        thoughtText = "";
                    } else if (isCommentSegment) {
                        console.log(chalk.gray(`\n[💬 Comment segment ended]`));
                    }
                }
            }
        });

        // Use the collected response or fallback to the returned response
        const finalResponse = fullResponse || response;

        const responseTime = Date.now() - startTime;
        console.log(chalk.green(`\n\n[Final Response]: "${finalResponse}"`));
        console.log(chalk.cyan(`Response time: ${responseTime}ms, Length: ${finalResponse.length} chars`));

        // Send final message
        sendSSE({
            type: "done",
            message: finalResponse,
            conversationId: conversationId || "default",
            timestamp: new Date().toISOString()
        });

        // Clean up tool call callback
        clearToolCallCallback();
        reply.raw.end();

    } catch (error) {
        console.error(chalk.red("Error processing chat request:"), error);
        clearToolCallCallback();

        // Helper function to send SSE message (redefine if headers not sent yet)
        const sendSSE = (data: any) => {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            reply.raw.write(message);
        };

        if (!reply.raw.headersSent) {
            reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        } else {
            sendSSE({
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred"
            });
            reply.raw.end();
        }
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

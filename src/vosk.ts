import path from "path";
import { fileURLToPath } from "url";
import Fastify from "fastify";
import cors from "@fastify/cors";

import chalk from "chalk";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";
import { functions, setToolCallCallback, clearToolCallCallback } from "./tools/index.js";

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
const systemPrompt = `You are a helpful AI assistant. Keep your responses clear and concise. Your job is to answer questions factually, so limit follow-up questions to only ask for clarification if needed to provide a useful response.

CRITICAL: You have access to a web_search tool. When users ask about current weather, recent news, real-time information, or anything requiring up-to-date data, you MUST use the web_search tool immediately. Do not say you cannot provide real-time information - use the tool to search and then provide the answer based on the search results.

If you aren't sure of the answer or need confirmation, use the web_search tool to get a factual answer. Do not make up answers if you are not certain and have not validated with external sources.  Do not suggest verifying data elsewhere.`;

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

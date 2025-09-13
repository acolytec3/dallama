import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import chalk from 'chalk';
import { llmService } from '../services/llmService.js';
import { sessionService } from '../services/sessionService.js';
import { ChatRequest, ChatResponse, ChatMessage } from '../types/index.js';

export async function chatRoutes(fastify: FastifyInstance) {
    // Chat endpoint for text-based conversations
    fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const chatRequest = request.body as ChatRequest;

            if (!chatRequest.text || chatRequest.text.trim() === "") {
                return reply.status(400).send({
                    error: "No text provided",
                    message: "Please provide text in the request body"
                });
            }

            console.log(chalk.blue(`Processing chat request: "${chatRequest.text}"`));

            // Get or create conversation
            const conversation = sessionService.getOrCreateConversation(
                chatRequest.conversationId,
                chatRequest.userId,
                chatRequest.frontendType || 'web'
            );

            // Add user message to conversation
            const userMessage: ChatMessage = {
                id: Date.now().toString(),
                text: chatRequest.text,
                timestamp: new Date().toISOString(),
                sender: 'user',
                conversationId: conversation.id
            };
            sessionService.addMessage(conversation.id, userMessage);

            // Process with LLM
            const llmRequest: ChatRequest = {
                ...chatRequest,
                conversationId: conversation.id
            };
            const llmResponse = await llmService.processChat(llmRequest);

            // Add assistant message to conversation
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: llmResponse.message,
                timestamp: llmResponse.timestamp,
                sender: 'assistant',
                conversationId: conversation.id
            };
            sessionService.addMessage(conversation.id, assistantMessage);

            // Return response
            const response: ChatResponse = {
                message: llmResponse.message,
                conversationId: conversation.id,
                timestamp: llmResponse.timestamp,
                components: llmResponse.components
            };

            return response;

        } catch (error) {
            console.error(chalk.red("Error processing chat request:"), error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });

    // Get conversation history
    fastify.get('/conversations/:conversationId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { conversationId } = request.params as { conversationId: string };
            const conversation = sessionService.getConversation(conversationId);

            if (!conversation) {
                return reply.status(404).send({
                    error: "Conversation not found",
                    message: `Conversation ${conversationId} does not exist`
                });
            }

            return {
                conversation,
                messages: conversation.messages
            };

        } catch (error) {
            console.error(chalk.red("Error getting conversation:"), error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });

    // Clear conversation
    fastify.delete('/conversations/:conversationId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { conversationId } = request.params as { conversationId: string };
            const conversation = sessionService.getConversation(conversationId);

            if (!conversation) {
                return reply.status(404).send({
                    error: "Conversation not found",
                    message: `Conversation ${conversationId} does not exist`
                });
            }

            sessionService.clearConversation(conversationId);

            return {
                message: "Conversation cleared successfully",
                conversationId
            };

        } catch (error) {
            console.error(chalk.red("Error clearing conversation:"), error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });

    // Get session statistics
    fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const stats = sessionService.getStats();
            return stats;
        } catch (error) {
            console.error(chalk.red("Error getting stats:"), error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });
}


import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import chalk from 'chalk';
import { ttsService } from '../services/ttsService.js';
import { TTSRequest, TTSResponse } from '../types/index.js';

export async function ttsRoutes(fastify: FastifyInstance) {
    // TTS endpoint for text-to-speech generation
    fastify.post('/tts', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const ttsRequest = request.body as TTSRequest;

            if (!ttsRequest.text || ttsRequest.text.trim() === "") {
                return reply.status(400).send({
                    error: "No text provided",
                    message: "Please provide text in the request body"
                });
            }

            console.log(chalk.blue(`Generating TTS for: "${ttsRequest.text.substring(0, 50)}..."`));

            const ttsResponse = await ttsService.generateSpeech(ttsRequest);

            return ttsResponse;

        } catch (error) {
            console.error(chalk.red("Error generating TTS:"), error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });

    // Serve audio files
    fastify.get('/audio/:filename', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { filename } = request.params as { filename: string };

            // Validate filename to prevent directory traversal
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return reply.status(400).send({
                    error: "Invalid filename",
                    message: "Filename contains invalid characters"
                });
            }

            const audioData = await ttsService.getAudioFile(filename);

            reply.type('audio/wav');
            return audioData;

        } catch (error) {
            console.error(chalk.red("Error serving audio file:"), error);
            return reply.status(404).send({
                error: "Audio file not found",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });
}


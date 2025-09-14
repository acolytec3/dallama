import Fastify from 'fastify';
import cors from '@fastify/cors';
import chalk from 'chalk';
import { config } from './config.js';
import { llmService } from './services/llmService.js';
import { ttsService } from './services/ttsService.js';
import { sessionService } from './services/sessionService.js';
import { chatRoutes } from './routes/chat.js';
import { searchRoutes } from './routes/search.js';
import { ttsRoutes } from './routes/tts.js';

const fastify = Fastify({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
            }
        }
    }
});

async function startServer() {
    try {
        console.log(chalk.yellow('🚀 Starting Multi-Frontend AI Assistant Server...'));

        // Initialize services
        console.log(chalk.blue('📋 Initializing services...'));
        await llmService.initialize();
        await ttsService.initialize();
        console.log(chalk.green('✅ Services initialized'));

        // Register CORS plugin
        console.log(chalk.blue('🌐 Configuring CORS...'));
        await fastify.register(cors, {
            origin: config.cors.origins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: config.cors.credentials
        });

        // Register routes
        console.log(chalk.blue('🛣️  Registering routes...'));
        await fastify.register(chatRoutes, { prefix: '/api' });
        await fastify.register(searchRoutes, { prefix: '/api' });
        await fastify.register(ttsRoutes, { prefix: '/api' });

        // Health check endpoint
        fastify.get('/health', async (request, reply) => {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    llm: 'initialized',
                    tts: 'initialized',
                    sessions: sessionService.getStats()
                },
                config: {
                    port: config.port,
                    host: config.host,
                    llmModel: config.llm.modelPath,
                    ttsProvider: config.tts.provider
                }
            };
        });

        // Root endpoint
        fastify.get('/', async (request, reply) => {
            return {
                message: 'Multi-Frontend AI Assistant Server',
                version: '1.0.0',
                status: 'running',
                endpoints: {
                    health: '/health',
                    chat: '/api/chat',
                    search: '/api/search',
                    tts: '/api/tts',
                    conversations: '/api/conversations/:id',
                    stats: '/api/stats'
                },
                frontends: {
                    mobile: 'PWA for Android/iOS',
                    voice: 'Headless Pi4 voice application',
                    web: 'React web interface'
                }
            };
        });


        // Error handling
        fastify.setErrorHandler((error, request, reply) => {
            console.error(chalk.red('Server error:'), error);
            reply.status(500).send({
                error: 'Internal server error',
                message: error.message || 'An unexpected error occurred'
            });
        });

        // Start server
        const address = await fastify.listen({
            port: config.port,
            host: config.host
        });

        console.log(chalk.green('✅ Server started successfully!'));
        console.log(chalk.cyan(`🌐 Server running at: ${address}`));
        console.log(chalk.cyan(`📱 Mobile app: http://${config.host}:5173`));
        console.log(chalk.cyan(`🎤 Voice app: Configure Pi4 to connect to ${address}`));
        console.log(chalk.yellow('📋 Available endpoints:'));
        console.log(chalk.gray('  GET  /                    - Server info'));
        console.log(chalk.gray('  GET  /health              - Health check'));
        console.log(chalk.gray('  POST /api/chat            - Text chat'));
        console.log(chalk.gray('  POST /api/search          - Wikipedia search'));
        console.log(chalk.gray('  POST /api/tts              - Text-to-speech'));
        console.log(chalk.gray('  GET  /api/conversations/:id - Get conversation'));
        console.log(chalk.gray('  GET  /api/stats           - Session statistics'));
        console.log(chalk.gray('  GET  /api/audio/:filename  - Audio files'));

    } catch (error) {
        console.error(chalk.red('❌ Failed to start server:'), error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down gracefully...'));
    await fastify.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down gracefully...'));
    await fastify.close();
    process.exit(0);
});

// Start the server
startServer();

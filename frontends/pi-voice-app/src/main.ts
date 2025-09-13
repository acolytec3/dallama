import chalk from 'chalk';
import { config } from './config.js';
import { ApiClient } from './apiClient.js';
import { AudioProcessor } from './audioProcessor.js';
import { WakeWordDetector } from './wakeWordDetector.js';
import { VoiceActivityDetector } from './voiceActivityDetector.js';

export class Pi4VoiceAssistant {
    private apiClient: ApiClient;
    private audioProcessor: AudioProcessor;
    private wakeWordDetector: WakeWordDetector;
    private vad: VoiceActivityDetector;
    private isRunning: boolean = false;
    private conversationId: string = 'pi4-default';

    constructor() {
        this.apiClient = new ApiClient();
        this.audioProcessor = new AudioProcessor();
        this.wakeWordDetector = new WakeWordDetector();
        this.vad = new VoiceActivityDetector();
    }

    async initialize(): Promise<void> {
        try {
            console.log(chalk.yellow('🚀 Initializing Pi4 Voice Assistant...'));

            // Test server connection first
            const isConnected = await this.apiClient.testConnection();
            if (!isConnected) {
                throw new Error('Cannot connect to AI server');
            }

            // Initialize all components
            await this.audioProcessor.initialize();
            await this.wakeWordDetector.initialize();
            await this.vad.initialize();

            console.log(chalk.green('✅ Pi4 Voice Assistant initialized successfully'));
        } catch (error) {
            console.error(chalk.red('❌ Failed to initialize Pi4 Voice Assistant:'), error);
            throw error;
        }
    }

    async start(): Promise<void> {
        try {
            console.log(chalk.yellow('🎤 Starting Pi4 Voice Assistant...'));

            this.isRunning = true;

            // Start wake word detection
            await this.wakeWordDetector.startListening();

            // Set up wake word callback
            this.wakeWordDetector.onWakeWord(() => {
                this.handleWakeWord().catch(error => {
                    console.error(chalk.red('Error handling wake word:'), error);
                });
            });

            console.log(chalk.green('✅ Pi4 Voice Assistant is now listening for wake word'));
            console.log(chalk.cyan(`Wake phrase: "${this.wakeWordDetector.getPhrase()}"`));

            // Keep the application running
            this.keepAlive();
        } catch (error) {
            console.error(chalk.red('❌ Failed to start Pi4 Voice Assistant:'), error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        try {
            console.log(chalk.yellow('🛑 Stopping Pi4 Voice Assistant...'));

            this.isRunning = false;
            await this.wakeWordDetector.stopListening();

            console.log(chalk.green('✅ Pi4 Voice Assistant stopped'));
        } catch (error) {
            console.error(chalk.red('❌ Error stopping Pi4 Voice Assistant:'), error);
            throw error;
        }
    }

    private async handleWakeWord(): Promise<void> {
        try {
            console.log(chalk.magenta('🎯 Wake word detected! Processing...'));

            // Play wake sound
            await this.audioProcessor.playWakeSound();

            // Record speech using VAD
            console.log(chalk.blue('🎙️ Recording speech...'));
            const audioData = await this.audioProcessor.recordWithVAD();

            // For now, we'll simulate transcription
            // In a real implementation, this would send audio to STT service
            const mockTranscript = "What is the biggest cat in the world?";
            console.log(chalk.blue(`📝 Transcribed: "${mockTranscript}"`));

            // Send to AI server
            console.log(chalk.blue('🤖 Sending to AI server...'));
            const chatResponse = await this.apiClient.sendMessage({
                text: mockTranscript,
                conversationId: this.conversationId,
                frontendType: 'voice-only',
                userId: 'pi4-user'
            });

            console.log(chalk.green(`💬 AI Response: "${chatResponse.message}"`));

            // Generate TTS
            console.log(chalk.blue('🔊 Generating speech...'));
            const ttsResponse = await this.apiClient.generateTTS({
                text: chatResponse.message,
                voice: 'en-US-Neural2-F',
                speed: 1.0
            });

            // Download and play audio
            console.log(chalk.blue('🎵 Playing response...'));
            const audioUrl = this.apiClient.getFullAudioUrl(ttsResponse.audioUrl);
            const audioBuffer = await this.apiClient.downloadAudio(audioUrl);
            await this.audioProcessor.playAudio(audioBuffer);

            console.log(chalk.green('✅ Voice interaction completed'));

        } catch (error) {
            console.error(chalk.red('❌ Error in voice interaction:'), error);

            // Play error sound or speak error message
            try {
                await this.audioProcessor.playAudio(Buffer.from('Error occurred'));
            } catch (playError) {
                console.error(chalk.red('Failed to play error sound:'), playError);
            }
        }
    }

    private keepAlive(): void {
        // Keep the application running
        const interval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }

            // Log heartbeat every 30 seconds
            console.log(chalk.gray(`💓 Heartbeat: ${new Date().toISOString()}`));
        }, 30000);
    }

    isActive(): boolean {
        return this.isRunning;
    }

    getStatus(): object {
        return {
            isRunning: this.isRunning,
            wakeWordEnabled: this.wakeWordDetector.isActive(),
            wakePhrase: this.wakeWordDetector.getPhrase(),
            vadEnabled: this.vad.isEnabled(),
            conversationId: this.conversationId,
            serverUrl: config.server.baseUrl,
        };
    }
}

// Main application entry point
async function main() {
    const assistant = new Pi4VoiceAssistant();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down gracefully...'));
        await assistant.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down gracefully...'));
        await assistant.stop();
        process.exit(0);
    });

    try {
        await assistant.initialize();
        await assistant.start();
    } catch (error) {
        console.error(chalk.red('❌ Fatal error:'), error);
        process.exit(1);
    }
}

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error(chalk.red('❌ Unhandled error:'), error);
        process.exit(1);
    });
}


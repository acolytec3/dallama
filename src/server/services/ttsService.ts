import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import chalk from "chalk";
import { TTSRequest, TTSResponse } from '../types/index.js';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class TTSService {
    private audioCacheDir: string;
    private initialized = false;

    constructor() {
        this.audioCacheDir = path.join(__dirname, "..", "..", "..", "cache", "audio");
        this.ensureCacheDir();
    }

    private ensureCacheDir(): void {
        if (!fs.existsSync(this.audioCacheDir)) {
            fs.mkdirSync(this.audioCacheDir, { recursive: true });
        }
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            console.log(chalk.yellow("Initializing TTS service..."));

            // For now, we'll implement a simple file-based TTS
            // In a full implementation, this would integrate with Kokoro API
            console.log(chalk.green("TTS service initialized (mock implementation)"));
            this.initialized = true;
        } catch (error) {
            console.error(chalk.red("Failed to initialize TTS service:"), error);
            throw error;
        }
    }

    async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log(chalk.blue(`Generating speech for: "${request.text.substring(0, 50)}..."`));
            const startTime = Date.now();

            // For now, create a mock audio file
            // In a full implementation, this would call Kokoro API
            const audioFileName = this.generateAudioFileName(request.text);
            const audioFilePath = path.join(this.audioCacheDir, audioFileName);

            // Create a mock audio file (in real implementation, this would be actual audio data)
            const mockAudioData = Buffer.from('mock audio data for: ' + request.text);
            fs.writeFileSync(audioFilePath, mockAudioData);

            const duration = this.estimateDuration(request.text);
            const responseTime = Date.now() - startTime;

            console.log(chalk.green(`TTS generation completed in ${responseTime}ms`));

            return {
                audioUrl: `/api/audio/${audioFileName}`,
                duration
            };

        } catch (error) {
            console.error(chalk.red("Error generating speech:"), error);
            throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private generateAudioFileName(text: string): string {
        // Generate a unique filename based on text hash and timestamp
        const hash = this.simpleHash(text);
        const timestamp = Date.now();
        return `tts_${hash}_${timestamp}.wav`;
    }

    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    private estimateDuration(text: string): number {
        // Estimate duration based on text length (roughly 150 words per minute)
        const words = text.split(/\s+/).length;
        const minutes = words / 150;
        return Math.max(minutes * 60, 1); // Minimum 1 second
    }

    async getAudioFile(fileName: string): Promise<Buffer> {
        const filePath = path.join(this.audioCacheDir, fileName);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Audio file not found: ${fileName}`);
        }

        return fs.readFileSync(filePath);
    }

    // Clean up old audio files (older than 1 hour)
    async cleanupOldFiles(): Promise<void> {
        try {
            const files = fs.readdirSync(this.audioCacheDir);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(this.audioCacheDir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtime.getTime() > oneHour) {
                    fs.unlinkSync(filePath);
                    console.log(chalk.yellow(`Cleaned up old audio file: ${file}`));
                }
            }
        } catch (error) {
            console.error(chalk.red("Error cleaning up audio files:"), error);
        }
    }
}

// Export singleton instance
export const ttsService = new TTSService();

// Clean up old files every hour
setInterval(() => {
    ttsService.cleanupOldFiles().catch(console.error);
}, 60 * 60 * 1000);


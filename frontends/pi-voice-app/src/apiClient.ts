import axios, { AxiosInstance } from 'axios';
import chalk from 'chalk';
import { config } from './config.js';

export interface ChatRequest {
    text: string;
    conversationId?: string;
    frontendType?: 'mobile' | 'voice-only';
    userId?: string;
}

export interface ChatResponse {
    message: string;
    conversationId: string;
    timestamp: string;
    audioUrl?: string;
}

export interface TTSRequest {
    text: string;
    voice?: string;
    speed?: number;
}

export interface TTSResponse {
    audioUrl: string;
    duration: number;
}

export class ApiClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.server.baseUrl;
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: config.server.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Pi4-Voice-Assistant/1.0',
            },
        });

        // Add request/response interceptors for logging
        this.client.interceptors.request.use(
            (config) => {
                console.log(chalk.blue(`API Request: ${config.method?.toUpperCase()} ${config.url}`));
                return config;
            },
            (error) => {
                console.error(chalk.red('API Request Error:'), error);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                console.log(chalk.green(`API Response: ${response.status} ${response.config.url}`));
                return response;
            },
            (error) => {
                console.error(chalk.red('API Response Error:'), error.response?.status, error.message);
                return Promise.reject(error);
            }
        );
    }

    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        try {
            console.log(chalk.blue(`Sending message: "${request.text}"`));
            const response = await this.client.post('/api/chat', request);
            return response.data;
        } catch (error) {
            console.error(chalk.red('Error sending message:'), error);
            throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async generateTTS(request: TTSRequest): Promise<TTSResponse> {
        try {
            console.log(chalk.blue(`Generating TTS for: "${request.text.substring(0, 50)}..."`));
            const response = await this.client.post('/api/tts', request);
            return response.data;
        } catch (error) {
            console.error(chalk.red('Error generating TTS:'), error);
            throw new Error(`Failed to generate TTS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async downloadAudio(audioUrl: string): Promise<Buffer> {
        try {
            console.log(chalk.blue(`Downloading audio: ${audioUrl}`));
            const response = await this.client.get(audioUrl, {
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        } catch (error) {
            console.error(chalk.red('Error downloading audio:'), error);
            throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            console.log(chalk.blue('Testing connection to server...'));
            const response = await this.client.get('/health');
            const isHealthy = response.data.status === 'healthy';
            console.log(chalk.green(`Connection test: ${isHealthy ? 'SUCCESS' : 'FAILED'}`));
            return isHealthy;
        } catch (error) {
            console.error(chalk.red('Connection test failed:'), error);
            return false;
        }
    }

    getFullAudioUrl(audioUrl: string): string {
        if (audioUrl.startsWith('http')) {
            return audioUrl;
        }
        return `${this.baseUrl}${audioUrl}`;
    }
}


import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

export interface Pi4Config {
    server: {
        baseUrl: string;
        timeout: number;
    };
    audio: {
        inputDevice: string;
        outputDevice: string;
        sampleRate: number;
        channels: number;
    };
    wakeWord: {
        enabled: boolean;
        phrase: string;
        sensitivity: number;
    };
    vad: {
        enabled: boolean;
        silenceThreshold: number;
        minSpeechDuration: number;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        file: string;
    };
}

export const config: Pi4Config = {
    server: {
        baseUrl: process.env.SERVER_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.SERVER_TIMEOUT || '30000'),
    },
    audio: {
        inputDevice: process.env.AUDIO_INPUT_DEVICE || 'default',
        outputDevice: process.env.AUDIO_OUTPUT_DEVICE || 'default',
        sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000'),
        channels: parseInt(process.env.AUDIO_CHANNELS || '1'),
    },
    wakeWord: {
        enabled: process.env.WAKE_WORD_ENABLED !== 'false',
        phrase: process.env.WAKE_WORD_PHRASE || 'hey assistant',
        sensitivity: parseFloat(process.env.WAKE_WORD_SENSITIVITY || '0.5'),
    },
    vad: {
        enabled: process.env.VAD_ENABLED !== 'false',
        silenceThreshold: parseFloat(process.env.VAD_SILENCE_THRESHOLD || '0.3'),
        minSpeechDuration: parseInt(process.env.VAD_MIN_SPEECH_DURATION || '1000'),
    },
    logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        file: process.env.LOG_FILE || '/var/log/voice-assistant.log',
    },
};






import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
    port: number;
    host: string;
    cors: {
        origins: string[];
        credentials: boolean;
    };
    llm: {
        modelPath: string;
        maxTokens: number;
        temperature: number;
        topP: number;
        topK: number;
        frontendConfigs: {
            mobile: {
                maxTokens: number;
                temperature: number;
                topP: number;
                topK: number;
            };
            web: {
                maxTokens: number;
                temperature: number;
                topP: number;
                topK: number;
            };
            'voice-only': {
                maxTokens: number;
                temperature: number;
                topP: number;
                topK: number;
            };
        };
    };
    tts: {
        provider: 'kokoro' | 'local';
        voice: string;
        speed: number;
    };
    stt: {
        provider: 'vosk' | 'whisper';
        modelPath: string;
    };
    auth: {
        enabled: boolean;
        secret: string;
    };
}

export const config: ServerConfig = {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    cors: {
        origins: [
            'http://localhost:5173', // Web app dev
            'http://localhost:3001', // Web app prod
            'http://localhost:8081', // Mobile app dev
            'http://localhost:8082', // Voice-only dev
            ...(process.env.CORS_ORIGINS?.split(',') || [])
        ],
        credentials: true
    },
    llm: {
        modelPath: process.env.LLM_MODEL_PATH || 'hf_bartowski_gemma-2-2b-it-Q6_K_L.gguf',
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1500'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
        topP: parseFloat(process.env.LLM_TOP_P || '0.8'),
        topK: parseInt(process.env.LLM_TOP_K || '50'),
        frontendConfigs: {
            mobile: {
                maxTokens: parseInt(process.env.LLM_MOBILE_MAX_TOKENS || '2000'),
                temperature: parseFloat(process.env.LLM_MOBILE_TEMPERATURE || '0.8'),
                topP: parseFloat(process.env.LLM_MOBILE_TOP_P || '0.9'),
                topK: parseInt(process.env.LLM_MOBILE_TOP_K || '60')
            },
            web: {
                maxTokens: parseInt(process.env.LLM_WEB_MAX_TOKENS || '1800'),
                temperature: parseFloat(process.env.LLM_WEB_TEMPERATURE || '0.75'),
                topP: parseFloat(process.env.LLM_WEB_TOP_P || '0.85'),
                topK: parseInt(process.env.LLM_WEB_TOP_K || '55')
            },
            'voice-only': {
                maxTokens: parseInt(process.env.LLM_VOICE_MAX_TOKENS || '800'),
                temperature: parseFloat(process.env.LLM_VOICE_TEMPERATURE || '0.6'),
                topP: parseFloat(process.env.LLM_VOICE_TOP_P || '0.7'),
                topK: parseInt(process.env.LLM_VOICE_TOP_K || '40')
            }
        }
    },
    tts: {
        provider: (process.env.TTS_PROVIDER as 'kokoro' | 'local') || 'kokoro',
        voice: process.env.TTS_VOICE || 'en-US-Neural2-F',
        speed: parseFloat(process.env.TTS_SPEED || '1.0')
    },
    stt: {
        provider: (process.env.STT_PROVIDER as 'vosk' | 'whisper') || 'vosk',
        modelPath: process.env.STT_MODEL_PATH || 'vosk-model-small-en-us-0.15'
    },
    auth: {
        enabled: process.env.AUTH_ENABLED === 'true',
        secret: process.env.JWT_SECRET || 'your-secret-key'
    }
};


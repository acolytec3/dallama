import { llmService as serverLLMService } from './llmService';
import { localLLMService } from './localLLMService';

export interface ChatRequest {
    text: string;
    conversationId?: string;
}

export interface ChatResponse {
    message: string;
    conversationId: string;
    timestamp: string;
}

export interface ChatError {
    error: string;
    message: string;
}

export type LLMMode = 'local' | 'server';

class UnifiedLLMService {
    private mode: LLMMode = 'local'; // Default to local mode
    private localStorageKey = 'llm-mode-preference';

    constructor() {
        // Load user preference from localStorage
        this.loadModePreference();
        console.log('UnifiedLLMService initialized with mode:', this.mode);
    }

    private loadModePreference(): void {
        try {
            const savedMode = localStorage.getItem(this.localStorageKey);
            if (savedMode === 'server' || savedMode === 'local') {
                this.mode = savedMode;
            }
        } catch (error) {
            console.warn('Failed to load LLM mode preference from localStorage:', error);
        }
    }

    private saveModePreference(): void {
        try {
            localStorage.setItem(this.localStorageKey, this.mode);
        } catch (error) {
            console.warn('Failed to save LLM mode preference to localStorage:', error);
        }
    }

    setMode(mode: LLMMode): void {
        this.mode = mode;
        this.saveModePreference();
        console.log('LLM mode changed to:', mode);
    }

    getMode(): LLMMode {
        return this.mode;
    }

    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        console.log(`UnifiedLLMService.sendMessage called with mode: ${this.mode}`);

        try {
            if (this.mode === 'local') {
                return await localLLMService.sendMessage(request);
            } else {
                return await serverLLMService.sendMessage(request);
            }
        } catch (error) {
            console.error(`Error in ${this.mode} LLM service:`, error);

            // If local mode fails, try server mode as fallback
            if (this.mode === 'local') {
                console.log('Local LLM failed, trying server LLM as fallback...');
                try {
                    return await serverLLMService.sendMessage(request);
                } catch (serverError) {
                    console.error('Server LLM fallback also failed:', serverError);
                    throw error; // Throw original error
                }
            }

            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        console.log(`UnifiedLLMService.testConnection called with mode: ${this.mode}`);

        try {
            if (this.mode === 'local') {
                return await localLLMService.testConnection();
            } else {
                return await serverLLMService.testConnection();
            }
        } catch (error) {
            console.error(`Connection test failed for ${this.mode} mode:`, error);
            return false;
        }
    }

    // Test both connections and return status
    async testAllConnections(): Promise<{ local: boolean; server: boolean }> {
        console.log('Testing all LLM connections...');

        const [localResult, serverResult] = await Promise.allSettled([
            localLLMService.testConnection(),
            serverLLMService.testConnection()
        ]);

        const results = {
            local: localResult.status === 'fulfilled' ? localResult.value : false,
            server: serverResult.status === 'fulfilled' ? serverResult.value : false
        };

        console.log('All connection test results:', results);
        return results;
    }

    // Get initialization status for local LLM
    getLocalLLMStatus(): { isInitializing: boolean; isReady: boolean } {
        return localLLMService.getInitializationStatus();
    }
}

// Export a singleton instance
export const unifiedLLMService = new UnifiedLLMService();

export default UnifiedLLMService; 
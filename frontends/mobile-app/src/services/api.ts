export interface ChatRequest {
    text: string;
    conversationId?: string;
    frontendType?: 'web' | 'mobile' | 'voice-only';
    userId?: string;
}

export interface ChatResponse {
    message: string;
    conversationId: string;
    timestamp: string;
    audioUrl?: string;
    components?: DynamicComponent[];
}

export interface DynamicComponent {
    type: string;
    props: Record<string, any>;
    children?: React.ReactNode;
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

class ApiService {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string = 'http://localhost:3000', timeout: number = 30000) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        console.log("ApiService.sendMessage called with:", request);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            console.log("Making HTTP request to:", `${this.baseUrl}/api/chat`);
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            console.log("HTTP response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("HTTP error response:", errorData);
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data: ChatResponse = await response.json();
            console.log("HTTP success response:", data);
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("ApiService.sendMessage error:", error);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw error;
            }

            throw new Error('An unexpected error occurred');
        }
    }

    async generateTTS(request: TTSRequest): Promise<TTSResponse> {
        console.log("ApiService.generateTTS called with:", request);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data: TTSResponse = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("ApiService.generateTTS error:", error);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('TTS request timed out. Please try again.');
                }
                throw error;
            }

            throw new Error('An unexpected error occurred');
        }
    }

    async testConnection(): Promise<boolean> {
        console.log("ApiService.testConnection called");
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000), // 5 second timeout for health check
            });

            console.log("Connection test response status:", response.status);

            if (!response.ok) {
                console.log("Connection test failed - response not ok");
                return false;
            }

            const data = await response.json();
            console.log("Connection test response data:", data);
            const isHealthy = data.status === 'healthy';
            console.log("Connection test result:", isHealthy);
            return isHealthy;
        } catch (error) {
            console.error('API server connection test failed:', error);
            return false;
        }
    }

    async getConversation(conversationId: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}`, {
                method: 'GET',
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`Failed to get conversation: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting conversation:', error);
            throw error;
        }
    }

    async clearConversation(conversationId: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}`, {
                method: 'DELETE',
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`Failed to clear conversation: ${response.status}`);
            }
        } catch (error) {
            console.error('Error clearing conversation:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const apiService = new ApiService();

export default ApiService;



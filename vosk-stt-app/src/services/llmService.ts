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

class LLMService {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string = 'http://localhost:3000', timeout: number = 30000) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        console.log("LLMService.sendMessage called with:", request);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            console.log("Making HTTP request to:", `${this.baseUrl}/chat`);
            const response = await fetch(`${this.baseUrl}/chat`, {
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
                const errorData: ChatError = await response.json();
                console.error("HTTP error response:", errorData);
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data: ChatResponse = await response.json();
            console.log("HTTP success response:", data);
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("LLMService.sendMessage error:", error);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw error;
            }

            throw new Error('An unexpected error occurred');
        }
    }

    async testConnection(): Promise<boolean> {
        console.log("LLMService.testConnection called");
        try {
            const response = await fetch(`${this.baseUrl}/`, {
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
            const isReady = data.status === 'ready';
            console.log("Connection test result:", isReady);
            return isReady;
        } catch (error) {
            console.error('LLM server connection test failed:', error);
            return false;
        }
    }
}

// Export a singleton instance
export const llmService = new LLMService();

export default LLMService; 
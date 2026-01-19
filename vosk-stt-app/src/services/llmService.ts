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

export interface SSEChunk {
    type: 'chunk' | 'tool_call' | 'done' | 'error';
    text?: string;
    message?: string;
    tool?: string;
    conversationId?: string;
    timestamp?: string;
    error?: string;
}

export type OnChunkCallback = (chunk: SSEChunk) => void;

class LLMService {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string = 'http://localhost:3000', timeout: number = 30000) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    async sendMessage(
        request: ChatRequest,
        onChunk?: OnChunkCallback
    ): Promise<ChatResponse> {
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
                // Try to parse error as JSON, fallback to text
                let errorData: ChatError;
                try {
                    errorData = await response.json();
                } catch {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                console.error("HTTP error response:", errorData);
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Check if response is SSE (text/event-stream)
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('text/event-stream')) {
                return await this.handleSSEResponse(response, onChunk, request.conversationId);
            }

            // Fallback to JSON response (for non-streaming endpoints)
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

    private async handleSSEResponse(
        response: Response,
        onChunk?: OnChunkCallback,
        conversationId?: string
    ): Promise<ChatResponse> {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullMessage = '';
        let finalResponse: ChatResponse | null = null;

        if (!reader) {
            throw new Error('Response body is not readable');
        }

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6)) as SSEChunk;
                            
                            // Call chunk callback if provided
                            if (onChunk) {
                                onChunk(data);
                            }

                            // Handle different event types
                            if (data.type === 'chunk' && data.text) {
                                fullMessage += data.text;
                            } else if (data.type === 'tool_call' && data.message) {
                                // Tool call message - could be displayed to user
                                if (onChunk) {
                                    onChunk(data);
                                }
                            } else if (data.type === 'done' && data.message) {
                                // Final response
                                finalResponse = {
                                    message: data.message,
                                    conversationId: data.conversationId || conversationId || 'default',
                                    timestamp: data.timestamp || new Date().toISOString(),
                                };
                                fullMessage = data.message; // Use the final message
                            } else if (data.type === 'error') {
                                throw new Error(data.error || data.message || 'Unknown error');
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse SSE data:', line, parseError);
                        }
                    }
                }
            }

            // If we didn't get a 'done' event, construct response from accumulated message
            if (!finalResponse) {
                finalResponse = {
                    message: fullMessage || 'No response received',
                    conversationId: conversationId || 'default',
                    timestamp: new Date().toISOString(),
                };
            }

            console.log("SSE response complete:", finalResponse);
            return finalResponse;
        } catch (error) {
            console.error("Error reading SSE stream:", error);
            throw error;
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
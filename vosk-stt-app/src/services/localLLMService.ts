import { pipeline } from '@huggingface/transformers';

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

class LocalLLMService {
    private model: any = null;
    private isInitializing: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {
        console.log('LocalLLMService initialized');
    }

    private async initializeModel(): Promise<void> {
        if (this.model) {
            return; // Already initialized
        }

        if (this.isInitializing && this.initializationPromise) {
            return this.initializationPromise; // Return existing promise
        }

        this.isInitializing = true;
        this.initializationPromise = this._initializeModel();

        try {
            await this.initializationPromise;
        } finally {
            this.isInitializing = false;
        }
    }

    private async _initializeModel(): Promise<void> {
        try {
            console.log('Initializing SmolLM2-135M-Instruct model...');

            // Initialize the text-generation pipeline with SmolLM2-135M-Instruct
            this.model = await pipeline(
                'text-generation',
                'HuggingFaceTB/SmolLM2-135M-Instruct'
            );

            console.log('SmolLM2-135M-Instruct model initialized successfully');
        } catch (error) {
            console.error('Failed to initialize local LLM model:', error);
            throw new Error('Failed to load local AI model. Please check your internet connection and try again.');
        }
    }

    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        console.log("LocalLLMService.sendMessage called with:", request);

        try {
            // Ensure model is initialized
            await this.initializeModel();

            if (!this.model) {
                throw new Error('Model not initialized');
            }

            // Format the prompt for instruction-tuned model
            const prompt = this.formatPrompt(request.text);
            console.log("Formatted prompt:", prompt);

            // Generate response with restrictive parameters for concise but complete responses
            const result = await this.model(prompt, {
                max_new_tokens: 48,
                temperature: 0.05,
                do_sample: true,
                top_p: 0.6,
                repetition_penalty: 1.4,
                stop: ['Question:', 'Answer:', 'User:', 'Assistant:', '\n\n'],
            });

            console.log("Raw model result:", result);

            // Extract the generated text
            let responseText = '';
            if (Array.isArray(result) && result.length > 0) {
                responseText = result[0].generated_text || '';
            } else if (typeof result === 'string') {
                responseText = result;
            } else if (result && typeof result === 'object' && 'generated_text' in result) {
                responseText = result.generated_text || '';
            }

            // Clean up the response by removing the original prompt
            const cleanResponse = this.cleanResponse(responseText, prompt);
            console.log("Clean response:", cleanResponse);

            const response: ChatResponse = {
                message: cleanResponse,
                conversationId: request.conversationId || 'default',
                timestamp: new Date().toISOString(),
            };

            console.log("LocalLLMService response:", response);
            return response;

        } catch (error) {
            console.error("LocalLLMService.sendMessage error:", error);

            if (error instanceof Error) {
                throw error;
            }

            throw new Error('An unexpected error occurred with the local AI model');
        }
    }

    private formatPrompt(userInput: string): string {
        // Very focused prompt for concise responses
        return `You are a helpful AI assistant. Give very short, direct answers. Maximum 2 sentences.

Question: ${userInput}
Answer:`;
    }

    private cleanResponse(responseText: string, originalPrompt: string): string {
        // Remove the original prompt from the response
        let cleanText = responseText;

        if (cleanText.includes(originalPrompt)) {
            cleanText = cleanText.replace(originalPrompt, '').trim();
        }

        // Remove any remaining prompt parts
        cleanText = cleanText.replace(/^.*?Answer:\s*/s, '');
        cleanText = cleanText.replace(/Question:.*$/s, '');
        cleanText = cleanText.replace(/^.*?Assistant:\s*/s, '');
        cleanText = cleanText.replace(/User:.*$/s, '');

        // Clean up any extra whitespace and newlines
        cleanText = cleanText.trim();

        // Truncate if response is too long (prevent rambling)
        if (cleanText.length > 150) {
            cleanText = cleanText.substring(0, 150).trim();
            // Try to end at a complete sentence
            const lastPeriod = cleanText.lastIndexOf('.');
            if (lastPeriod > 75) {
                cleanText = cleanText.substring(0, lastPeriod + 1);
            }
        }

        // If response is empty or too short, provide a fallback
        if (!cleanText || cleanText.length < 3) {
            cleanText = "I understand. How can I help you?";
        }



        return cleanText;
    }

    async testConnection(): Promise<boolean> {
        try {
            console.log("Testing local LLM connection...");
            await this.initializeModel();
            console.log("Local LLM connection test successful");
            return true;
        } catch (error) {
            console.error("Local LLM connection test failed:", error);
            return false;
        }
    }

    // Method to check if model is ready
    isReady(): boolean {
        return this.model !== null;
    }

    // Method to get initialization status
    getInitializationStatus(): { isInitializing: boolean; isReady: boolean } {
        return {
            isInitializing: this.isInitializing,
            isReady: this.isReady(),
        };
    }


}

// Export a singleton instance
export const localLLMService = new LocalLLMService();

export default LocalLLMService; 
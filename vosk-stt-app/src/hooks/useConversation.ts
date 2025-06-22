import { useState, useCallback } from 'react';
import { llmService, ChatRequest, ChatResponse } from '../services/llmService';

export interface ConversationMessage {
    id: string;
    text: string;
    timestamp: string;
    type: 'user' | 'ai';
}

export interface ConversationState {
    messages: ConversationMessage[];
    isLoading: boolean;
    error: string | null;
    isConnected: boolean;
}

export function useConversation() {
    const [state, setState] = useState<ConversationState>({
        messages: [],
        isLoading: false,
        error: null,
        isConnected: false,
    });

    const testConnection = useCallback(async () => {
        try {
            console.log("Testing LLM server connection...");
            const isConnected = await llmService.testConnection();
            console.log("LLM server connection test result:", isConnected);
            setState(prev => ({ ...prev, isConnected }));
            return isConnected;
        } catch {
            console.log("LLM server connection test failed");
            setState(prev => ({ ...prev, isConnected: false }));
            return false;
        }
    }, []);

    const updateCurrentMessage = useCallback((text: string) => {
        setState(prev => {
            const updatedMessages = [...prev.messages];

            // If the last message is from the user and we're still loading, update it
            if (updatedMessages.length > 0 &&
                updatedMessages[updatedMessages.length - 1].type === 'user' &&
                prev.isLoading) {
                updatedMessages[updatedMessages.length - 1] = {
                    ...updatedMessages[updatedMessages.length - 1],
                    text: text,
                    timestamp: new Date().toISOString()
                };
            } else {
                // Otherwise, add a new user message
                const userMessage: ConversationMessage = {
                    id: Date.now().toString(),
                    text: text,
                    timestamp: new Date().toISOString(),
                    type: 'user',
                };
                updatedMessages.push(userMessage);
            }

            return {
                ...prev,
                messages: updatedMessages,
            };
        });
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        console.log("sendMessage called with text:", text);
        if (!text.trim()) {
            console.log("sendMessage: empty text, returning");
            return;
        }

        // Don't add a new user message here since updateCurrentMessage already did that
        // Just set loading state and send to LLM
        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            const request: ChatRequest = {
                text: text.trim(),
                conversationId: 'default', // Could be made configurable
            };

            console.log("Sending request to LLM server:", request);
            const response: ChatResponse = await llmService.sendMessage(request);
            console.log("Received response from LLM server:", response);

            const aiMessage: ConversationMessage = {
                id: (Date.now() + 1).toString(),
                text: response.message,
                timestamp: response.timestamp,
                type: 'ai',
            };

            console.log("Adding AI message to state:", aiMessage);

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, aiMessage],
                isLoading: false,
                error: null,
            }));
        } catch (error) {
            console.error("Error in sendMessage:", error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to get response from AI';

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
        }
    }, []);

    const clearConversation = useCallback(() => {
        setState(prev => ({
            ...prev,
            messages: [],
            error: null,
        }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({
            ...prev,
            error: null,
        }));
    }, []);

    return {
        ...state,
        sendMessage,
        updateCurrentMessage,
        clearConversation,
        clearError,
        testConnection,
    };
} 
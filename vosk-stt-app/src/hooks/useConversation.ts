import { useState, useCallback } from 'react';
import { llmService, ChatRequest, ChatResponse, SSEChunk } from '../services/llmService';

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
            console.log("Testing LLM connection...");
            const isConnected = await llmService.testConnection();
            console.log("LLM connection test result:", isConnected);
            setState(prev => ({
                ...prev,
                isConnected,
            }));
            return isConnected;
        } catch {
            console.log("LLM connection test failed");
            setState(prev => ({
                ...prev,
                isConnected: false,
            }));
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
        let aiMessageId: string | null = null;
        let accumulatedText = '';

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

            console.log("Sending request to LLM:", request);
            
            // Handle SSE streaming with onChunk callback
            const response: ChatResponse = await llmService.sendMessage(request, (chunk: SSEChunk) => {
                console.log("Received SSE chunk:", chunk);
                
                if (chunk.type === 'chunk' && chunk.text) {
                    // Accumulate streaming text
                    accumulatedText += chunk.text;
                    
                    // Update or create AI message with streaming text
                    setState(prev => {
                        const updatedMessages = [...prev.messages];
                        
                        if (aiMessageId) {
                            // Update existing message
                            const index = updatedMessages.findIndex(m => m.id === aiMessageId);
                            if (index >= 0) {
                                updatedMessages[index] = {
                                    ...updatedMessages[index],
                                    text: accumulatedText,
                                };
                            }
                        } else {
                            // Create new AI message
                            aiMessageId = Date.now().toString();
                            const newMessage: ConversationMessage = {
                                id: aiMessageId,
                                text: accumulatedText,
                                timestamp: new Date().toISOString(),
                                type: 'ai',
                            };
                            updatedMessages.push(newMessage);
                        }
                        
                        return {
                            ...prev,
                            messages: updatedMessages,
                        };
                    });
                } else if (chunk.type === 'tool_call' && chunk.message) {
                    // Show tool call message (e.g., "Just a moment while I check on that.")
                    setState(prev => {
                        const updatedMessages = [...prev.messages];
                        
                        if (!aiMessageId) {
                            aiMessageId = Date.now().toString();
                            const newMessage: ConversationMessage = {
                                id: aiMessageId,
                                text: chunk.message || '',
                                timestamp: new Date().toISOString(),
                                type: 'ai',
                            };
                            updatedMessages.push(newMessage);
                        } else {
                            const index = updatedMessages.findIndex(m => m.id === aiMessageId);
                            if (index >= 0) {
                                updatedMessages[index] = {
                                    ...updatedMessages[index],
                                    text: chunk.message || accumulatedText,
                                };
                            }
                        }
                        
                        return {
                            ...prev,
                            messages: updatedMessages,
                        };
                    });
                } else if (chunk.type === 'done' && chunk.message) {
                    // Final message received
                    accumulatedText = chunk.message;
                    setState(prev => {
                        const updatedMessages = [...prev.messages];
                        
                        if (aiMessageId) {
                            const index = updatedMessages.findIndex(m => m.id === aiMessageId);
                            if (index >= 0) {
                                updatedMessages[index] = {
                                    ...updatedMessages[index],
                                    text: chunk.message || accumulatedText,
                                    timestamp: chunk.timestamp || new Date().toISOString(),
                                };
                            }
                        } else {
                            aiMessageId = Date.now().toString();
                            const newMessage: ConversationMessage = {
                                id: aiMessageId,
                                text: chunk.message,
                                timestamp: chunk.timestamp || new Date().toISOString(),
                                type: 'ai',
                            };
                            updatedMessages.push(newMessage);
                        }
                        
                        return {
                            ...prev,
                            messages: updatedMessages,
                            isLoading: false,
                            error: null,
                        };
                    });
                } else if (chunk.type === 'error') {
                    throw new Error(chunk.error || chunk.message || 'Unknown error');
                }
            });
            
            console.log("Received final response from LLM:", response);

            // Ensure final message is set (in case done event wasn't processed)
            if (response.message && (!aiMessageId || accumulatedText !== response.message)) {
                setState(prev => {
                    const updatedMessages = [...prev.messages];
                    
                    if (aiMessageId) {
                        const index = updatedMessages.findIndex(m => m.id === aiMessageId);
                        if (index >= 0) {
                            updatedMessages[index] = {
                                ...updatedMessages[index],
                                text: response.message,
                                timestamp: response.timestamp,
                            };
                        }
                    } else {
                        const aiMessage: ConversationMessage = {
                            id: Date.now().toString(),
                            text: response.message,
                            timestamp: response.timestamp,
                            type: 'ai',
                        };
                        updatedMessages.push(aiMessage);
                    }
                    
                    return {
                        ...prev,
                        messages: updatedMessages,
                        isLoading: false,
                        error: null,
                    };
                });
            } else {
                // Just update loading state if message was already set via streaming
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: null,
                }));
            }
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
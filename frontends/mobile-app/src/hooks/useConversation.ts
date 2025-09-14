import { useState, useCallback } from 'react';
import { apiService, ChatRequest, ChatResponse } from '../services/api';

export interface Message {
    id: string;
    text: string;
    timestamp: string;
    sender: 'user' | 'assistant';
    conversationId: string;
    components?: any[];
}

export interface UseConversationReturn {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    isConnected: boolean;
    sendMessage: (text: string) => Promise<void>;
    updateCurrentMessage: (text: string) => void;
    clearConversation: () => void;
    clearError: () => void;
    testConnection: () => Promise<void>;
}

export function useConversation(): UseConversationReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [conversationId, setConversationId] = useState<string>('default');

    const testConnection = useCallback(async () => {
        try {
            const connected = await apiService.testConnection();
            setIsConnected(connected);
            if (!connected) {
                setError('Unable to connect to AI server');
            } else {
                setError(null);
            }
        } catch (err) {
            setIsConnected(false);
            setError('Connection test failed');
        }
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const request: ChatRequest = {
                text: text.trim(),
                conversationId,
                frontendType: 'mobile',
                userId: 'mobile-user'
            };

            const response: ChatResponse = await apiService.sendMessage(request);

            // Update conversation ID if it changed
            if (response.conversationId !== conversationId) {
                setConversationId(response.conversationId);
            }

            // Add assistant message
            const assistantMessage: Message = {
                id: Date.now().toString(),
                text: response.message,
                timestamp: response.timestamp,
                sender: 'assistant',
                conversationId: response.conversationId,
                components: response.components
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);
            console.error('Error sending message:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, conversationId]);

    const updateCurrentMessage = useCallback((text: string) => {
        if (!text.trim()) return;

        // Check if we already have a user message for this text
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.sender === 'user' && lastMessage.text === text) {
            return; // Don't add duplicate
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            timestamp: new Date().toISOString(),
            sender: 'user',
            conversationId
        };

        setMessages(prev => [...prev, userMessage]);
    }, [messages, conversationId]);

    const clearConversation = useCallback(async () => {
        try {
            await apiService.clearConversation(conversationId);
            setMessages([]);
            setError(null);
        } catch (err) {
            console.error('Error clearing conversation:', err);
            setError('Failed to clear conversation');
        }
    }, [conversationId]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        isConnected,
        sendMessage,
        updateCurrentMessage,
        clearConversation,
        clearError,
        testConnection
    };
}



import { v4 as uuidv4 } from 'uuid';
import { Conversation, ChatMessage, User } from '../types/index.js';

export class SessionService {
    private conversations: Map<string, Conversation> = new Map();
    private users: Map<string, User> = new Map();

    constructor() {
        // Initialize with a default conversation
        this.createConversation('default', 'voice-only');
    }

    createConversation(userId?: string, frontendType: 'web' | 'mobile' | 'voice-only' = 'web'): Conversation {
        const conversationId = uuidv4();
        const conversation: Conversation = {
            id: conversationId,
            userId,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            frontendType
        };

        this.conversations.set(conversationId, conversation);
        return conversation;
    }

    getConversation(conversationId: string): Conversation | undefined {
        return this.conversations.get(conversationId);
    }

    getOrCreateConversation(conversationId?: string, userId?: string, frontendType: 'web' | 'mobile' | 'voice-only' = 'web'): Conversation {
        if (conversationId && this.conversations.has(conversationId)) {
            return this.conversations.get(conversationId)!;
        }

        return this.createConversation(userId, frontendType);
    }

    addMessage(conversationId: string, message: ChatMessage): void {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        conversation.messages.push(message);
        conversation.updatedAt = new Date().toISOString();
    }

    getMessages(conversationId: string): ChatMessage[] {
        const conversation = this.conversations.get(conversationId);
        return conversation ? conversation.messages : [];
    }

    getRecentMessages(conversationId: string, limit: number = 10): ChatMessage[] {
        const messages = this.getMessages(conversationId);
        return messages.slice(-limit);
    }

    clearConversation(conversationId: string): void {
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.messages = [];
            conversation.updatedAt = new Date().toISOString();
        }
    }

    deleteConversation(conversationId: string): boolean {
        return this.conversations.delete(conversationId);
    }

    getUserConversations(userId: string): Conversation[] {
        return Array.from(this.conversations.values())
            .filter(conv => conv.userId === userId)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    createUser(name: string, email?: string): User {
        const userId = uuidv4();
        const user: User = {
            id: userId,
            name,
            email,
            preferences: {
                defaultVoice: 'en-US-Neural2-F',
                defaultSpeed: 1.0,
                frontendType: 'web'
            }
        };

        this.users.set(userId, user);
        return user;
    }

    getUser(userId: string): User | undefined {
        return this.users.get(userId);
    }

    updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): void {
        const user = this.users.get(userId);
        if (user) {
            user.preferences = { ...user.preferences, ...preferences };
        }
    }

    // Clean up old conversations (older than 24 hours)
    cleanupOldConversations(): void {
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        for (const [conversationId, conversation] of this.conversations.entries()) {
            const lastUpdate = new Date(conversation.updatedAt).getTime();
            if (now - lastUpdate > oneDay) {
                this.conversations.delete(conversationId);
                console.log(`Cleaned up old conversation: ${conversationId}`);
            }
        }
    }

    // Get conversation statistics
    getStats(): { totalConversations: number; totalMessages: number; totalUsers: number } {
        let totalMessages = 0;
        for (const conversation of this.conversations.values()) {
            totalMessages += conversation.messages.length;
        }

        return {
            totalConversations: this.conversations.size,
            totalMessages,
            totalUsers: this.users.size
        };
    }
}

// Export singleton instance
export const sessionService = new SessionService();

// Clean up old conversations every hour
setInterval(() => {
    sessionService.cleanupOldConversations();
}, 60 * 60 * 1000);


export interface ChatMessage {
    id: string;
    text: string;
    timestamp: string;
    sender: 'user' | 'assistant';
    conversationId: string;
}

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
    audioUrl?: string; // For voice-only frontends
    components?: DynamicComponent[]; // For mobile/web frontends
}

export interface VoiceRequest {
    audioData: string; // Base64 encoded audio
    conversationId?: string;
    frontendType?: 'mobile' | 'voice-only';
    userId?: string;
}

export interface VoiceResponse {
    text: string;
    response: string;
    conversationId: string;
    timestamp: string;
    audioUrl: string; // Generated TTS audio
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

export interface DynamicComponent {
    type: string;
    props: Record<string, any>;
    children?: any;
}

export interface Conversation {
    id: string;
    userId?: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    frontendType: 'web' | 'mobile' | 'voice-only';
}

export interface User {
    id: string;
    name: string;
    email?: string;
    preferences: {
        defaultVoice: string;
        defaultSpeed: number;
        frontendType: 'web' | 'mobile' | 'voice-only';
    };
}

export interface WikipediaSearchResult {
    title: string;
    snippet: string;
    pageId: string;
    url?: string;
}

export interface SearchRequest {
    query: string;
    maxResults?: number;
}

export interface SearchResponse {
    results: WikipediaSearchResult[];
    query: string;
    timestamp: string;
}

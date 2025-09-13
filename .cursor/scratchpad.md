# Multi-Frontend AI Agent Project Plan

## Project Overview
A hobbyist AI agent system running on local consumer hardware with multiple frontend interfaces:
- Mobile web app (PWA) for Android/iOS devices
- Headless voice application for Raspberry Pi 4 (Alexa-style)
- All sharing the same Gemma 3N LLM backend with Kokoro TTS

## Current State Analysis

### Existing Infrastructure
- **Backend**: Fastify server (`src/vosk.ts`) with Gemma 3 270M IT model
- **Web Frontend**: React + Vite + Chakra UI (`vosk-stt-app/`) with client-side Vosk STT
- **CLI Interface**: Command-line chat (`src/index.ts`)
- **Web Search**: Brave Search API integration
- **Voice Processing**: Client-side Vosk STT for speech recognition

### Current Capabilities
- Text and voice chat with LLM
- Web search via Brave Search API
- Real-time speech-to-text
- Conversation history
- CORS-enabled for multiple frontends

## Revised Architecture Plan

### 1. Backend Enhancements

#### Core Services
```
src/
├── server/
│   ├── index.ts              # Main server entry point
│   ├── config.ts             # Local network configuration
│   ├── services/
│   │   ├── llmService.ts     # Gemma 3N integration
│   │   ├── ttsService.ts     # Kokoro TTS integration
│   │   ├── searchService.ts  # Whitelisted web search (Wikipedia only)
│   │   └── sessionService.ts # Simple session management
│   ├── routes/
│   │   ├── chat.ts          # Text chat endpoint
│   │   ├── voice.ts         # Voice processing endpoint
│   │   ├── tts.ts           # Text-to-speech endpoint
│   │   └── search.ts        # Whitelisted search endpoint
│   └── types/
│       └── index.ts         # Shared type definitions
```

#### Key Changes
- **Upgrade to Gemma 3N**: Replace current Gemma 3 270M for better performance
- **Kokoro TTS**: Server-side text-to-speech generation
- **Whitelisted Search**: Replace Brave Search with Wikipedia-only access
- **Session Management**: Simple conversation tracking
- **Enhanced API**: Support for dynamic component rendering

### 2. Separate Frontend Applications

#### Mobile Web App (PWA)
```
frontends/
├── mobile-app/              # PWA for Android/iOS devices
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceInterface.tsx
│   │   │   ├── TextInterface.tsx
│   │   │   ├── DynamicComponentRenderer.tsx
│   │   │   ├── TouchControls.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── ConversationDisplay.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   │   ├── useVoiceMode.ts
│   │   │   ├── useConversation.ts
│   │   │   └── useAudio.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── audio.ts
│   │   │   └── pwa.ts
│   │   └── utils/
│   │       ├── audioUtils.ts
│   │       └── deviceUtils.ts
│   └── package.json
└── pi-voice-app/            # Headless voice application for Pi4
    ├── src/
    │   ├── main.ts          # Main application entry point
    │   ├── wakeWordDetector.ts
    │   ├── voiceActivityDetector.ts
    │   ├── audioProcessor.ts
    │   ├── apiClient.ts
    │   └── config.ts
    ├── package.json
    └── systemd/
        └── voice-assistant.service
```

#### Mobile App Features
- **Touch Interface**: Large buttons, swipe gestures, responsive design
- **Voice + Text**: Both input methods with full conversation history
- **Dynamic Components**: Interactive widgets and visual elements
- **PWA Features**: Installable, offline capability, background sync
- **Settings**: User preferences, voice settings, app configuration

#### Pi4 Voice Application Features
- **Headless Operation**: No UI, pure audio I/O
- **Wake Word Detection**: "Hey Assistant" trigger using OSS libraries
- **Voice Activity Detection**: VAD for speech recording
- **Audio-Only Focus**: Primary interaction through voice
- **Research Companion**: Optimized for factual Q&A
- **Systemd Service**: Auto-start on boot

### 3. Voice Recognition OSS Libraries

#### Wake Word Detection Libraries
1. **openWakeWord** - Open-source framework focused on performance and simplicity
   - Pre-trained models for common words/phrases
   - Good real-world performance
   - GitHub: https://github.com/dscripka/openWakeWord

2. **Porcupine** - On-device wake word detection engine
   - Deep learning powered
   - Standard and tiny model variants
   - Raspberry Pi support
   - GitHub: https://github.com/iotlibrary/Porcupine

3. **Howl** - Open-source wake word detection toolkit
   - Native support for open speech datasets
   - Web browser and other platform support
   - Research paper: https://arxiv.org/abs/2008.09606

#### Voice Activity Detection (VAD) Libraries
1. **libfvad** - Standalone VAD library based on WebRTC
   - BSD-3-Clause license
   - Easy integration
   - GitHub: https://github.com/dpirch/libfvad

2. **open-voice-activity-detection** - State-of-the-art VAD model
   - Silero VAD model implementation
   - Academic and commercial use
   - GitHub: https://github.com/stefanwebb/open-voice-activity-detection

3. **Kaldi** - Speech recognition toolkit with VAD
   - Widely used in research community
   - Comprehensive speech processing

#### Pi4 Voice Application Implementation
```typescript
// Pi4 Voice Application with OSS libraries
class Pi4VoiceAssistant {
  private wakeWordDetector: Porcupine; // or openWakeWord
  private vad: libfvad; // or open-voice-activity-detection
  private audioProcessor: AudioProcessor;
  private apiClient: ApiClient;

  async initialize() {
    // Initialize Porcupine wake word detection
    this.wakeWordDetector = new Porcupine({
      accessKey: 'your-access-key',
      keywords: ['hey assistant'],
      modelPath: './models/porcupine_params.pv'
    });

    // Initialize libfvad for voice activity detection
    this.vad = new libfvad({
      sampleRate: 16000,
      frameDuration: 30 // ms
    });

    // Set up audio processing
    this.audioProcessor = new AudioProcessor({
      inputDevice: 'default',
      outputDevice: 'default',
      sampleRate: 16000
    });
  }

  async startListening() {
    // Start continuous wake word detection
    this.wakeWordDetector.start();
    
    this.wakeWordDetector.onWakeWord(() => {
      this.handleWakeWord();
    });
  }

  private async handleWakeWord() {
    // Play wake sound
    await this.audioProcessor.playWakeSound();
    
    // Record speech using VAD
    const audioData = await this.recordWithVAD();
    
    // Send to backend for processing
    const response = await this.apiClient.processVoice(audioData);
    
    // Play TTS response
    await this.audioProcessor.playAudio(response.audioUrl);
  }

  private async recordWithVAD(): Promise<Buffer> {
    const audioChunks: Buffer[] = [];
    let isSpeaking = false;
    
    return new Promise((resolve) => {
      this.audioProcessor.startRecording((chunk: Buffer) => {
        const vadResult = this.vad.process(chunk);
        
        if (vadResult === 1) { // Voice detected
          isSpeaking = true;
          audioChunks.push(chunk);
        } else if (vadResult === 0 && isSpeaking) { // Silence after speech
          // Wait for 1 second of silence to end recording
          setTimeout(() => {
            this.audioProcessor.stopRecording();
            resolve(Buffer.concat(audioChunks));
          }, 1000);
        }
      });
    });
  }
}
```

### 4. Dynamic Component Rendering

#### Component Registry System
```typescript
interface DynamicComponent {
  type: string;
  props: Record<string, any>;
  children?: React.ReactNode;
}

const componentRegistry: ComponentRegistry = {
  'weather-card': WeatherCard,
  'timer-display': TimerDisplay,
  'calculator': Calculator,
  'image-gallery': ImageGallery,
  'chart': Chart,
  'button-group': ButtonGroup,
  'status-indicator': StatusIndicator,
  'form': DynamicForm,
  'list': DynamicList,
  'modal': Modal,
};
```

#### LLM Response Format
```typescript
interface LLMResponse {
  text: string;
  components?: DynamicComponent[];
  audioUrl?: string;
  timestamp: string;
}
```

#### Example Components
- **Weather Card**: Display weather information
- **Timer Display**: Interactive countdown timers
- **Calculator**: Functional calculator
- **Image Gallery**: Display images
- **Charts**: Data visualization
- **Button Groups**: Interactive controls

### 5. Whitelisted Web Search (Wikipedia Only)

#### Wikipedia API Integration
Wikipedia provides two main APIs for accessing content:

**MediaWiki Action API** (`https://en.wikipedia.org/w/api.php`):
- Used for searching articles and retrieving page metadata
- Example: Search for "Earth" articles
- Returns JSON with search results including titles, snippets, and page IDs

**Wikimedia REST API** (`https://en.wikipedia.org/api/rest_v1/`):
- Optimized for high-volume use cases
- Provides page summaries and content in machine-readable format
- Example: Get summary of "Earth" article
- Returns concise summaries in JSON format

**Usage Guidelines**:
- Set unique `User-Agent` header to identify your application
- Limit to 200 requests per second to avoid impacting other users
- Both APIs are free and open to use

#### Implementation Details
```typescript
class WikipediaSearchService {
  private baseUrl = 'https://en.wikipedia.org/api/rest_v1';
  private actionApiUrl = 'https://en.wikipedia.org/w/api.php';
  private userAgent = 'Dallama-AI-Assistant/1.0';
  
  async search(query: string): Promise<SearchResult[]> {
    const response = await fetch(
      `${this.actionApiUrl}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`,
      {
        headers: { 'User-Agent': this.userAgent }
      }
    );
    const data = await response.json();
    return data.query.search.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      pageId: item.pageid
    }));
  }
  
  async getPageSummary(pageTitle: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/page/summary/${encodeURIComponent(pageTitle)}`,
      {
        headers: { 'User-Agent': this.userAgent }
      }
    );
    const data = await response.json();
    return data.extract;
  }
  
  async getPageContent(pageId: string): Promise<string> {
    // Extract relevant content from Wikipedia pages
    // Filter for factual information only
  }
}
```

#### Use Cases for Voice-Only Interface
- "What is the biggest cat in the world?"
- "How many kinds of quartz are there?"
- "What is the capital of France?"
- "How does photosynthesis work?"
- "What are the main types of renewable energy?"

### 6. Hardware Setup

#### Local Network Configuration
```
Your Local Network:
├── Main Server (Your current machine)
│   ├── Backend API (Fastify + Gemma 3N)
│   └── Mobile Web App (PWA)
├── Raspberry Pi 4 (Headless voice device)
│   ├── Node.js voice application
│   ├── Microphone input
│   ├── Speaker output
│   └── LED status indicator (optional)
└── Mobile Devices (Android/iOS)
    └── Mobile web app (PWA)
```

#### Network Access
- **Backend**: `http://192.168.1.100:3000`
- **Mobile App**: `http://192.168.1.100:5173`
- **CORS**: Configured for local network IPs

### 7. Implementation Phases

#### Phase 1: Enhanced Backend (Week 1-2)
1. **Upgrade to Gemma 3N**
   - Download and configure Gemma 3N model
   - Update model loading in backend
   - Test performance and quality

2. **Implement Kokoro TTS**
   - Integrate Kokoro TTS service
   - Add TTS endpoint to API
   - Test audio generation and quality

3. **Whitelisted Wikipedia Search**
   - Replace Brave Search with Wikipedia API integration
   - Implement MediaWiki Action API for search
   - Implement Wikimedia REST API for page summaries
   - Add proper User-Agent headers and rate limiting
   - Test factual accuracy and response quality

4. **Enhanced API Structure**
   - Refactor existing `vosk.ts` into modular services
   - Add session management
   - Implement dynamic component support

#### Phase 2: Mobile Web App (Week 3-4)
1. **Enhanced Mobile Interface**
   - Create mobile-optimized PWA
   - Implement dynamic component system
   - Add touch controls and responsive design
   - Test on mobile devices

2. **Dynamic Component System**
   - Create component registry
   - Implement component renderer
   - Build example components (calculator, timer, etc.)

3. **PWA Features**
   - Installable on mobile devices
   - Offline capability
   - Background sync

#### Phase 3: Pi4 Voice Application (Week 5)
1. **Pi4 Hardware Setup**
   - Install Raspberry Pi OS
   - Configure audio I/O (microphone and speakers)
   - Set up Node.js environment

2. **Voice Application Development**
   - Implement headless voice application
   - Integrate Porcupine wake word detection
   - Integrate libfvad voice activity detection
   - Configure audio processing pipeline

3. **Systemd Service Setup**
   - Create systemd service for auto-start
   - Configure logging and error handling
   - Test boot-time startup

#### Phase 4: Testing & Optimization (Week 6)
1. **Cross-Device Testing**
   - Test mobile app on Android/iOS
   - Test voice application on Pi4
   - Verify conversation sync across devices

2. **Performance Optimization**
   - Optimize LLM response times
   - Improve TTS audio quality
   - Reduce network latency

3. **User Experience Refinement**
   - Polish mobile UI/UX
   - Optimize voice application reliability
   - Add error handling and recovery

### 8. Technical Specifications

#### Backend Requirements
- **LLM**: Gemma 3N (local inference)
- **TTS**: Kokoro (server-side generation)
- **STT**: Vosk (client-side) + Whisper (server-side fallback)
- **Search**: Wikipedia API only
- **Storage**: SQLite for sessions, local file system for audio cache

#### Mobile App Requirements
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **UI Library**: Chakra UI
- **PWA**: Service workers, manifest
- **Audio**: Web Audio API

#### Pi4 Voice Application Requirements
- **Wake Word**: Porcupine or openWakeWord
- **VAD**: libfvad or open-voice-activity-detection
- **Audio**: ALSA for Pi4 audio I/O
- **Runtime**: Node.js with native bindings
- **Service**: Systemd for auto-start

#### Network Requirements
- **Local Network**: Static IPs for main machine and Pi4
- **Ports**: 3000 (backend), 5173 (mobile app)
- **CORS**: Configured for local network access

### 9. Security & Limitations

#### Web Access Restrictions
- **Wikipedia Only**: No general web search
- **Factual Content**: Focus on educational/research queries
- **No Social Media**: No access to social platforms
- **No Shopping**: No e-commerce or product recommendations

#### Voice-Only Interface Limitations
- **Research Companion**: Primary use case for factual questions


- **No Complex Tasks**: No web browsing, email, or complex operations
- **Educational Focus**: Optimized for learning and information retrieval

### 10. Success Metrics

#### Performance Goals
- **Response Time**: < 2 seconds for text, < 3 seconds for voice
- **Audio Quality**: Clear, natural-sounding TTS
- **Accuracy**: Factual responses with Wikipedia citations
- **Reliability**: 99% uptime on local network

#### User Experience Goals
- **Mobile**: Smooth touch interactions, responsive design
- **Voice**: Natural conversation flow, clear audio output
- **Cross-Device**: Seamless conversation sync
- **Offline**: Basic functionality without internet

### 11. Future Enhancements

#### Potential Additions
- **Local Knowledge Base**: Add custom documents/databases
- **Voice Commands**: "Set timer", "Play music", etc.
- **Home Automation**: Integrate with smart home devices
- **Multi-language**: Support for additional languages
- **Advanced Components**: More interactive widgets

#### Scalability Considerations
- **Multiple Pi4s**: Support for multiple voice devices
- **Family Accounts**: User-specific preferences and history
- **Content Filtering**: Age-appropriate content for children
- **Backup System**: Conversation and settings backup

## Next Steps

1. **Start with Phase 1**: Upgrade backend to Gemma 3N and implement Kokoro TTS
2. **Test Wikipedia Search**: Verify factual accuracy and response quality
3. **Build Mobile App**: Create PWA with dynamic components
4. **Develop Pi4 Voice App**: Implement headless voice application with OSS libraries
5. **Iterate and Improve**: Based on testing and user feedback

This plan provides a clear roadmap for building a powerful, yet controlled AI assistant that serves as a research companion while maintaining security and focusing on factual, educational content. 
# Dallama: 

A simple client/server set up for running your own LLM-powered chat agent locally

## LLM model
This uses `node-llama-cpp` in the backend.  To use, download a gguf compiled model from [here](https://huggingface.co/mradermacher) and place in `[repo_root]/models`.
Update the model name in `src/vosk.ts` to match your model name.

## STT model
This project uses [vosk speech-to-text processing](https://alphacephei.com/vosk/models) for relatively light weight STT.  Download your preferred model from [here](https://alphacephei.com/vosk/models) and then decompress in `models/[your_vosk_model]`.  Note, prefererably use `vosk-model-small-en-us-0.15` since the STT is done client-side and otherwise you will download a multiple GB model into your browser.  I dunno, haven't tried it.  The small model has worked well enough for my local development.

Then, go to `vosk-stt-app/src/components/ModelLoader.tsx` and change the model directory name if you use something other than the small model linked above.

Then, follow below instructions to get started.

# Backend & Frontend Setup

## Backend (Node.js + TypeScript)

1. **Install dependencies & download model:**
   ```bash
   npm install
   ```
2. **Start the backend service:**
   ```bash
   npm start
   ```

---

## Frontend (Vosk STT Web App)

1. **Navigate to the frontend directory:**
   ```bash
   cd vosk-stt-app
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the frontend dev server:**
   ```bash
   npm run dev
   ```

The frontend will be available at the local address printed in your terminal (default: http://localhost:5173).

---

# Integrating External Frontends

This guide provides everything you need to integrate a custom frontend application with the Dallama LLM chat server.

## Server Overview

The LLM chat server runs on **port 3000** by default and provides a REST API for chat interactions. The server uses Fastify and supports CORS for cross-origin requests.

### Base URL
- **Default**: `http://localhost:3000`
- **Production**: Update the base URL to match your deployment

## API Endpoints

### 1. Health Check Endpoint

**GET** `/`

Check if the server is ready to accept requests.

**Response:**
```json
{
  "message": "Hello from LLM chat server",
  "status": "ready"
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:3000/');
const data = await response.json();
console.log(data.status); // "ready"
```

### 2. Chat Endpoint

**POST** `/chat`

Send a message to the LLM and receive a response.

**Request Body:**
```typescript
{
  text: string;              // Required: The user's message text
  conversationId?: string;   // Optional: Conversation identifier for context
}
```

**Success Response (200):**
```typescript
{
  message: string;           // The LLM's response text
  conversationId: string;    // The conversation ID (or "default" if not provided)
  timestamp: string;         // ISO 8601 timestamp
}
```

**Error Responses:**

- **400 Bad Request**: Missing or empty text
  ```json
  {
    "error": "No text provided",
    "message": "Please provide transcribed text in the request body"
  }
  ```

- **500 Internal Server Error**: Server processing error
  ```json
  {
    "error": "Internal server error",
    "message": "Error details..."
  }
  ```

- **502 Bad Gateway**: Web search API failure (when using search functionality)
  ```json
  {
    "error": "Web search failed",
    "message": "Error details from Brave Search API"
  }
  ```

**Example Request:**
```javascript
const response = await fetch('http://localhost:3000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello, how are you?',
    conversationId: 'user-123-conversation-1'
  })
});

const data = await response.json();
console.log(data.message); // LLM response
```

## Special Features

### Web Search Integration

The server automatically detects web search requests when the message text starts with "search for" (case-insensitive). When detected:

1. The server extracts the search query
2. Performs a web search using Brave Search API
3. Summarizes the results using the LLM
4. Returns the summarized response

**Example:**
```javascript
// Request
{
  "text": "search for latest AI developments",
  "conversationId": "conv-1"
}

// The server will:
// 1. Search for "latest AI developments"
// 2. Get top 5 results
// 3. Summarize them with the LLM
// 4. Return the summary
```

## CORS Configuration

The server is configured to accept requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

**To add your frontend origin**, edit `src/vosk.ts`:

```typescript
await fastify.register(cors, {
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://your-frontend-domain.com"  // Add your origin here
    ],
    methods: ["GET", "POST"],
    credentials: true
});
```

For development, you can allow all origins (not recommended for production):
```typescript
await fastify.register(cors, {
    origin: true,  // Allows all origins
    methods: ["GET", "POST"],
    credentials: true
});
```

## Client Implementation Examples

### TypeScript/JavaScript Service Class

```typescript
interface ChatRequest {
    text: string;
    conversationId?: string;
}

interface ChatResponse {
    message: string;
    conversationId: string;
    timestamp: string;
}

interface ChatError {
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData: ChatError = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) return false;
            const data = await response.json();
            return data.status === 'ready';
        } catch (error) {
            return false;
        }
    }
}

// Usage
const llmService = new LLMService();
const response = await llmService.sendMessage({
    text: 'What is the weather like?',
    conversationId: 'my-conversation'
});
console.log(response.message);
```

### Python Example

```python
import requests
from typing import Optional, Dict, Any

class LLMService:
    def __init__(self, base_url: str = "http://localhost:3000", timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
    
    def send_message(self, text: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """Send a message to the LLM server."""
        url = f"{self.base_url}/chat"
        payload = {"text": text}
        if conversation_id:
            payload["conversationId"] = conversation_id
        
        try:
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test if the server is ready."""
        try:
            response = requests.get(self.base_url, timeout=5)
            data = response.json()
            return data.get("status") == "ready"
        except:
            return False

# Usage
service = LLMService()
response = service.send_message("Hello!", conversation_id="conv-1")
print(response["message"])
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';

interface ChatMessage {
    text: string;
    conversationId?: string;
}

interface ChatResponse {
    message: string;
    conversationId: string;
    timestamp: string;
}

export function useLLMChat(baseUrl: string = 'http://localhost:3000') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (message: ChatMessage): Promise<ChatResponse | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Request failed');
            }

            const data = await response.json();
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    return { sendMessage, loading, error };
}

// Usage in component
function ChatComponent() {
    const { sendMessage, loading, error } = useLLMChat();
    const [response, setResponse] = useState<string>('');

    const handleSend = async () => {
        const result = await sendMessage({
            text: 'Hello!',
            conversationId: 'my-conversation'
        });
        if (result) {
            setResponse(result.message);
        }
    };

    return (
        <div>
            <button onClick={handleSend} disabled={loading}>
                Send Message
            </button>
            {error && <p>Error: {error}</p>}
            {response && <p>Response: {response}</p>}
        </div>
    );
}
```

## Error Handling Best Practices

1. **Always check response status** before parsing JSON
2. **Implement timeout handling** - LLM responses can take time
3. **Handle network errors** gracefully
4. **Provide user feedback** during long-running requests
5. **Retry logic** can be helpful for transient failures

## Request Timeout Considerations

- **Default timeout**: 30 seconds is recommended
- **Health check**: 5 seconds is sufficient
- **LLM processing**: Can vary based on model size and response length
- The server is optimized for brief responses (under 100 words)

## Conversation Management

The `conversationId` parameter is optional but recommended for:
- Tracking conversation context
- Organizing messages in your UI
- Future features that may use conversation history

If not provided, the server defaults to `"default"`.

## Testing Your Integration

1. **Start the server**: `npm start` (from the project root)
2. **Test health check**: `curl http://localhost:3000/`
3. **Test chat endpoint**: 
   ```bash
   curl -X POST http://localhost:3000/chat \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello, how are you?"}'
   ```

## Reference Implementation

For a complete reference implementation, see:
- `vosk-stt-app/src/services/llmService.ts` - TypeScript service class
- `vosk-stt-app/src/hooks/useConversation.ts` - React hook example

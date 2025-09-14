import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";
import { ChatRequest, ChatResponse, DynamicComponent } from '../types/index.js';
import { wikipediaSearchService } from './searchService.js';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "..", "..", "..", "models");

export class LLMService {
    private llama: any;
    private llm: any;
    private context: any;
    private session: LlamaChatSession | undefined;
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            console.log(chalk.yellow("Initializing LLM service..."));

            this.llama = await getLlama();

            console.log(chalk.yellow("Resolving model file..."));
            const modelPath = await resolveModelFile(
                config.llm.modelPath,
                modelsDirectory
            );

            console.log(chalk.yellow("Loading model..."));
            this.llm = await this.llama.loadModel({ modelPath });

            console.log(chalk.yellow("Creating context..."));
            this.context = await this.llm.createContext();

            this.session = new LlamaChatSession({
                contextSequence: this.context.getSequence(),
            });

            // Add system prompt for concise, helpful responses
            const systemPrompt = `You are a helpful AI assistant optimized for voice conversations. Keep your responses brief and clear without being verbose. Focus on being helpful and direct. Avoid unnecessary explanations or expansive language.

IMPORTANT: Always be honest about data limitations. If you don't have access to real-time data (like weather), explain this clearly. However, you can still demonstrate components with placeholder examples when users specifically ask for them.

When appropriate, you can include dynamic components in your responses using this format:
{
  "text": "Your response text here",
  "components": [
    {
      "type": "component-name",
      "props": {
        "prop1": "value1",
        "prop2": "value2"
      }
    }
  ]
}

Available components:
- weather-card: Display weather information (use only when user specifically requests a weather card component)
- timer-display: Show countdown timers
- calculator: Interactive calculator
- image-gallery: Display images
- chart: Show data charts
- button-group: Interactive buttons
- status-indicator: Show status
- form: Dynamic forms
- list: Interactive lists
- modal: Popup dialogs

Keep responses concise and use components when they enhance the user experience. Be honest about data limitations.`;

            // Initialize the session with the system prompt
            await this.session.prompt(systemPrompt);

            this.initialized = true;
            console.log(chalk.green("LLM service initialized successfully"));
        } catch (error) {
            console.error(chalk.red("Failed to initialize LLM service:"), error);
            throw error;
        }
    }

    async processChat(request: ChatRequest): Promise<ChatResponse> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log(chalk.blue(`Processing text: "${request.text}"`));
            const startTime = Date.now();

            let response: string;
            let components: DynamicComponent[] | undefined;

            // Check if this is a search request
            if (wikipediaSearchService.isSearchPrompt(request.text)) {
                const searchQuery = wikipediaSearchService.extractSearchQuery(request.text);
                if (!searchQuery) {
                    throw new Error("No search query provided");
                }

                console.log(chalk.magenta(`Performing Wikipedia search for: "${searchQuery}"`));

                try {
                    const searchResults = await wikipediaSearchService.search({
                        query: searchQuery,
                        maxResults: 5
                    });

                    // Format results for LLM summarization
                    const formattedResults = searchResults.results.map((r, i) =>
                        `${i + 1}. ${r.title}\n${r.snippet}\n${r.url}`
                    ).join("\n\n");

                    const summaryPrompt = `Summarize the following Wikipedia search results for the query: "${searchQuery}". Be helpful in tone and provide a concise answer.\n\nResults:\n${formattedResults}`;

                    const summaryStart = Date.now();
                    response = await this.session!.prompt(summaryPrompt, {
                        maxTokens: 100,
                        temperature: 0.2,
                        topP: 0.7,
                        topK: 20,
                        repeatPenalty: { penalty: 1.1 },
                    });
                    const summaryTime = Date.now() - summaryStart;
                    console.log(chalk.yellow(`[LLM] Summary generation took ${summaryTime}ms`));
                } catch (err) {
                    console.error(chalk.red("Wikipedia Search API error:"), err);
                    response = "I'm sorry, I couldn't search Wikipedia at the moment. Please try again later.";
                }
            } else {
                // Normal LLM response
                response = await this.session!.prompt(request.text, {
                    maxTokens: config.llm.maxTokens,
                    temperature: config.llm.temperature,
                    topP: config.llm.topP,
                    topK: config.llm.topK,
                    repeatPenalty: { penalty: 1.1 },
                });
            }

            const responseTime = Date.now() - startTime;
            console.log(chalk.green(`LLM Response: "${response}"`));
            console.log(chalk.cyan(`Response time: ${responseTime}ms, Length: ${response.length} chars`));

            // Try to parse response for dynamic components
            try {
                const parsedResponse = JSON.parse(response);
                if (parsedResponse.components) {
                    components = parsedResponse.components;
                    response = parsedResponse.text;
                }
            } catch {
                // Response is plain text, no components
            }

            return {
                message: response,
                conversationId: request.conversationId || "default",
                timestamp: new Date().toISOString(),
                components
            };

        } catch (error) {
            console.error(chalk.red("Error processing chat request:"), error);
            throw new Error(`Failed to process chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async processVoice(audioData: string): Promise<ChatResponse> {
        // For now, we'll assume the audio has been transcribed to text
        // In a full implementation, this would integrate with STT service
        throw new Error("Voice processing not yet implemented");
    }
}

// Export singleton instance
export const llmService = new LLMService();

import { defineChatSessionFunction } from "node-llama-cpp";
import chalk from "chalk";
import { braveWebSearch } from "../braveSearch.js";
import { searchWikipediaWithDetails } from "../wikipediaSearch.js";
import type { ArticleSummarizer } from "../gemmaSummarizer.js";

// Callback for tool call notifications
let toolCallCallback: ((toolName: string) => void) | null = null;
let articleSummarizer: ArticleSummarizer | null = null;

// Track if tools were already called in the current request
let webSearchCalledThisRequest = false;
let wikipediaSearchCalledThisRequest = false;
let generalKnowledgeCalledThisRequest = false;

/**
 * Set a callback to be notified when a tool is called
 */
export function setToolCallCallback(callback: (toolName: string) => void) {
    toolCallCallback = callback;
}

/**
 * Clear the tool call callback and reset per-request state
 */
export function clearToolCallCallback() {
    toolCallCallback = null;
    webSearchCalledThisRequest = false;
    wikipediaSearchCalledThisRequest = false;
    generalKnowledgeCalledThisRequest = false;
}

/**
 * Register a secondary model-based summarizer used to condense long articles
 */
export function registerArticleSummarizer(summarizer: ArticleSummarizer) {
    articleSummarizer = summarizer;
}

/**
 * Get the current date formatted for the tool description
 */
function getCurrentDateString(): string {
    return new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

/**
 * Build the web search tool description with current date
 */
function getWebSearchDescription(): string {
    const currentDate = getCurrentDateString();
    const currentYear = new Date().getFullYear();
    return "Search the web for current information, news, facts, weather, or any topic. " +
        `Today's date is ${currentDate}. ` +
        "ALWAYS use this tool when users ask about: current weather, recent news, " +
        "real-time information, current events, or anything requiring up-to-date data. " +
        `When searching for current events or news, include the current year (${currentYear}) ` +
        "in your search query to get the most relevant results. " +
        "Use this tool whenever you don't have current information or when the user explicitly asks to search.";
}

/**
 * Define the web_search function using node-llama-cpp's native function calling API
 */
export const webSearchFunction = defineChatSessionFunction({
    get description() {
        return getWebSearchDescription();
    },
    params: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "The search query to look up on the web. " +
                    `For current events, include the year ${new Date().getFullYear()} in your query.`
            }
        },
        required: ["query"]
    },
    async handler(params) {
        const toolStartTime = Date.now();
        const { query } = params;

        // Check if web search was already called this request - only allow one call
        if (webSearchCalledThisRequest) {
            console.log(chalk.yellow("\n" + "=".repeat(80)));
            console.log(chalk.yellow.bold("[🔧 TOOL CALL] web_search - BLOCKED (already called this request)"));
            console.log(chalk.yellow("=".repeat(80)));
            console.log(chalk.cyan("Arguments:"), JSON.stringify(params, null, 2));
            console.log(chalk.yellow("Only one web search allowed per request"));
            console.log(chalk.yellow("=".repeat(80) + "\n"));
            return "Web search was already performed for this request. Please use the information already provided.";
        }

        // Mark web search as called for this request
        webSearchCalledThisRequest = true;

        // Notify callback that tool is being called
        if (toolCallCallback) {
            toolCallCallback("web_search");
        }

        // Log tool call initiation
        console.log(chalk.magenta("\n" + "=".repeat(80)));
        console.log(chalk.magenta.bold("[🔧 TOOL CALL] web_search"));
        console.log(chalk.magenta("=".repeat(80)));
        console.log(chalk.cyan("Arguments:"), JSON.stringify(params, null, 2));
        console.log(chalk.cyan("Timestamp:"), new Date().toISOString());

        if (!query || typeof query !== "string") {
            const error = `Error: Query parameter is required and must be a string`;
            const toolTime = Date.now() - toolStartTime;
            console.log(chalk.red("❌ Tool execution failed"));
            console.log(chalk.red("Error:"), error);
            console.log(chalk.yellow(`⏱️  Execution time: ${toolTime}ms`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));
            return error;
        }

        try {
            console.log(chalk.blue("🔍 Executing web search..."));
            const searchStartTime = Date.now();
            const results = await braveWebSearch(query, { count: 5 });
            const searchTime = Date.now() - searchStartTime;

            if (!results || results.length === 0) {
                const toolTime = Date.now() - toolStartTime;
                console.log(chalk.yellow("⚠️  No search results found"));
                console.log(chalk.yellow(`⏱️  Search API time: ${searchTime}ms`));
                console.log(chalk.yellow(`⏱️  Total execution time: ${toolTime}ms`));
                console.log(chalk.magenta("=".repeat(80) + "\n"));
                return "No search results found.";
            }

            // Log search results summary
            console.log(chalk.green(`✅ Search completed successfully`));
            console.log(chalk.green(`📊 Results found: ${results.length}`));
            console.log(chalk.yellow(`⏱️  Search API time: ${searchTime}ms`));

            // Log each result
            console.log(chalk.blue("\n📄 Search Results:"));
            results.forEach((result, index) => {
                console.log(chalk.gray(`  ${index + 1}. ${result.title}`));
                console.log(chalk.gray(`     URL: ${result.url}`));
                console.log(chalk.gray(`     Description: ${result.description.substring(0, 100)}${result.description.length > 100 ? "..." : ""}`));
            });

            // Format results for the LLM
            const formattedResults = results.map((r, i) =>
                `${i + 1}. ${r.title}\n${r.description}\n${r.url}`
            ).join("\n\n");

            const toolTime = Date.now() - toolStartTime;
            const resultLength = formattedResults.length;
            console.log(chalk.yellow(`⏱️  Total execution time: ${toolTime}ms`));
            console.log(chalk.cyan(`📝 Formatted result length: ${resultLength} characters`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));

            return formattedResults;
        } catch (error) {
            const toolTime = Date.now() - toolStartTime;
            const errorMessage = error instanceof Error ? error.message : "Unknown error during web search";
            console.log(chalk.red("❌ Tool execution failed"));
            console.log(chalk.red("Error:"), errorMessage);
            if (error instanceof Error && error.stack) {
                console.log(chalk.red("Stack trace:"), error.stack);
            }
            console.log(chalk.yellow(`⏱️  Execution time: ${toolTime}ms`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));
            return `Error performing web search: ${errorMessage}`;
        }
    }
});

/**
 * Define the wikipedia_search function using node-llama-cpp's native function calling API
 */
export const wikipediaSearchFunction = defineChatSessionFunction({
    description: "Search Wikipedia for comprehensive, factual information about a specific topic, person, place, concept, or keyword. Use this tool when users ask about: historical facts, scientific concepts, biographical information, geographical information, definitions, or any topic that would benefit from Wikipedia's comprehensive coverage. This tool provides detailed, well-sourced information from Wikipedia articles. Use this for topics that need cohesive, in-depth explanations rather than just current news or real-time data.",
    params: {
        type: "object",
        properties: {
            keyword: {
                type: "string",
                description: "The keyword or topic to search for on Wikipedia (e.g., 'quantum physics', 'Leonardo da Vinci', 'photosynthesis')"
            },
            fullArticle: {
                type: "boolean",
                description: "If true, retrieves the complete full article text. If false or omitted, retrieves a detailed summary (default: false). Use fullArticle=true when you need comprehensive, complete information about the topic."
            }
        },
        required: ["keyword"]
    },
    async handler(params) {
        const toolStartTime = Date.now();
        const { keyword, fullArticle } = params;

        // Check if Wikipedia was already called this request - only allow one call
        if (wikipediaSearchCalledThisRequest) {
            console.log(chalk.yellow("\n" + "=".repeat(80)));
            console.log(chalk.yellow.bold("[🔧 TOOL CALL] wikipedia_search - BLOCKED (already called this request)"));
            console.log(chalk.yellow("=".repeat(80)));
            console.log(chalk.cyan("Arguments:"), JSON.stringify(params, null, 2));
            console.log(chalk.yellow("Returning cached/previous result - only one Wikipedia search allowed per request"));
            console.log(chalk.yellow("=".repeat(80) + "\n"));
            return "Wikipedia was already searched for this request. Please use the information already provided, or respond based on your existing knowledge.";
        }

        // Mark Wikipedia as called for this request
        wikipediaSearchCalledThisRequest = true;

        // Notify callback that tool is being called
        if (toolCallCallback) {
            toolCallCallback("wikipedia_search");
        }

        // Log tool call initiation
        console.log(chalk.magenta("\n" + "=".repeat(80)));
        console.log(chalk.magenta.bold("[🔧 TOOL CALL] wikipedia_search"));
        console.log(chalk.magenta("=".repeat(80)));
        console.log(chalk.cyan("Arguments:"), JSON.stringify(params, null, 2));
        console.log(chalk.cyan("Timestamp:"), new Date().toISOString());

        if (!keyword || typeof keyword !== "string") {
            const error = `Error: Keyword parameter is required and must be a string`;
            const toolTime = Date.now() - toolStartTime;
            console.log(chalk.red("❌ Tool execution failed"));
            console.log(chalk.red("Error:"), error);
            console.log(chalk.yellow(`⏱️  Execution time: ${toolTime}ms`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));
            return error;
        }

        try {
            console.log(chalk.blue("🔍 Searching Wikipedia..."));
            const searchStartTime = Date.now();
            const { searchResults, topArticle } = await searchWikipediaWithDetails(keyword, {
                limit: 5,
                fullArticle: fullArticle ?? false,
                maxChars: fullArticle ? undefined : 3000 // Get more content by default for better answers
            });
            const searchTime = Date.now() - searchStartTime;

            if (!searchResults || searchResults.length === 0) {
                const toolTime = Date.now() - toolStartTime;
                console.log(chalk.yellow("⚠️  No Wikipedia articles found"));
                console.log(chalk.yellow(`⏱️  Search API time: ${searchTime}ms`));
                console.log(chalk.yellow(`⏱️  Total execution time: ${toolTime}ms`));
                console.log(chalk.magenta("=".repeat(80) + "\n"));
                return `I couldn't find any Wikipedia articles about "${keyword}". Please respond based on your existing knowledge, or let the user know you don't have information on this topic.`;
            }

            // Log search results summary
            console.log(chalk.green(`✅ Wikipedia search completed successfully`));
            console.log(chalk.green(`📊 Articles found: ${searchResults.length}`));
            if (topArticle) {
                console.log(chalk.green(`📖 Top article: ${topArticle.title}`));
            }
            console.log(chalk.yellow(`⏱️  Search API time: ${searchTime}ms`));

            // Log each result
            console.log(chalk.blue("\n📄 Wikipedia Articles:"));
            searchResults.forEach((result, index) => {
                console.log(chalk.gray(`  ${index + 1}. ${result.title}`));
                console.log(chalk.gray(`     URL: ${result.url}`));
                if (result.snippet) {
                    console.log(chalk.gray(`     Snippet: ${result.snippet.substring(0, 100)}${result.snippet.length > 100 ? "..." : ""}`));
                }
            });

            // Format results for the LLM - provide raw Wikipedia content without summarization
            let formattedResults = "";

            // If we have a top article with detailed extract, include it
            if (topArticle && topArticle.extract) {
                formattedResults += `Wikipedia Article: ${topArticle.title}\n\n`;
                formattedResults += `${topArticle.extract}\n\n`;
                formattedResults += `Source: ${topArticle.url}\n\n`;
                formattedResults += "---\n\n";
            }

            // Add all search results
            formattedResults += "Related Wikipedia Articles:\n\n";
            formattedResults += searchResults.map((r, i) => {
                let resultText = `${i + 1}. ${r.title}\n`;
                if (r.snippet) {
                    resultText += `${r.snippet}\n`;
                }
                resultText += `URL: ${r.url}`;
                return resultText;
            }).join("\n\n");

            const toolTime = Date.now() - toolStartTime;
            const resultLength = formattedResults.length;
            console.log(chalk.yellow(`⏱️  Total execution time: ${toolTime}ms`));
            console.log(chalk.cyan(`📝 Formatted result length: ${resultLength} characters`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));

            return formattedResults;
        } catch (error) {
            const toolTime = Date.now() - toolStartTime;
            const errorMessage = error instanceof Error ? error.message : "Unknown error during Wikipedia search";
            console.log(chalk.red("❌ Tool execution failed"));
            console.log(chalk.red("Error:"), errorMessage);
            if (error instanceof Error && error.stack) {
                console.log(chalk.red("Stack trace:"), error.stack);
            }
            console.log(chalk.yellow(`⏱️  Execution time: ${toolTime}ms`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));
            return `Error searching Wikipedia: ${errorMessage}`;
        }
    }
});

/**
 * Define the general_knowledge function for answering "tell me about X" style questions
 * Uses Wikipedia + Gemma summarizer to provide concise, informative responses
 */
export const generalKnowledgeFunction = defineChatSessionFunction({
    description: "Get general information about a subject or topic. Use this tool when users ask questions like 'Tell me about X', 'What is X?', 'Explain X', or want to learn general facts about a subject (animals, plants, people, places, concepts, etc.). This tool fetches information from Wikipedia and provides a concise, summarized answer. Perfect for educational or informational queries about any topic.",
    params: {
        type: "object",
        properties: {
            subject: {
                type: "string",
                description: "The subject or topic to learn about (e.g., 'poison dart frog', 'Albert Einstein', 'black holes', 'the Roman Empire')"
            }
        },
        required: ["subject"]
    },
    async handler(params) {
        const toolStartTime = Date.now();
        const { subject } = params;

        // Check if general_knowledge was already called this request
        if (generalKnowledgeCalledThisRequest) {
            console.log(chalk.yellow("\n" + "=".repeat(80)));
            console.log(chalk.yellow.bold("[🔧 TOOL CALL] general_knowledge - BLOCKED (already called this request)"));
            console.log(chalk.yellow("=".repeat(80)));
            console.log(chalk.cyan("Arguments:"), JSON.stringify(params, null, 2));
            console.log(chalk.yellow("Returning - only one general_knowledge search allowed per request"));
            console.log(chalk.yellow("=".repeat(80) + "\n"));
            return "General knowledge was already searched for this request. Please use the information already provided.";
        }

        // Mark as called for this request
        generalKnowledgeCalledThisRequest = true;

        // Notify callback that tool is being called
        if (toolCallCallback) {
            toolCallCallback("general_knowledge");
        }

        // Log tool call initiation
        console.log(chalk.magenta("\n" + "=".repeat(80)));
        console.log(chalk.magenta.bold("[🔧 TOOL CALL] general_knowledge"));
        console.log(chalk.magenta("=".repeat(80)));
        console.log(chalk.cyan("Arguments:"), JSON.stringify(params, null, 2));
        console.log(chalk.cyan("Timestamp:"), new Date().toISOString());

        if (!subject || typeof subject !== "string") {
            const error = `Error: Subject parameter is required and must be a string`;
            const toolTime = Date.now() - toolStartTime;
            console.log(chalk.red("❌ Tool execution failed"));
            console.log(chalk.red("Error:"), error);
            console.log(chalk.yellow(`⏱️  Execution time: ${toolTime}ms`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));
            return error;
        }

        // Check if summarizer is available
        if (!articleSummarizer) {
            const toolTime = Date.now() - toolStartTime;
            console.log(chalk.yellow("⚠️  Gemma summarizer not available, cannot use general_knowledge tool"));
            console.log(chalk.yellow(`⏱️  Execution time: ${toolTime}ms`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));
            return `The summarizer is not available. Please use wikipedia_search instead to look up "${subject}".`;
        }

        try {
            console.log(chalk.blue(`🔍 Searching Wikipedia for: "${subject}"...`));
            const searchStartTime = Date.now();
            
            // Search Wikipedia and get the first article with full content
            const { searchResults, topArticle } = await searchWikipediaWithDetails(subject, {
                limit: 1,  // Only need the first result
                fullArticle: true,  // Get full article for better summarization
                maxChars: undefined
            });
            const searchTime = Date.now() - searchStartTime;

            if (!searchResults || searchResults.length === 0 || !topArticle) {
                const toolTime = Date.now() - toolStartTime;
                console.log(chalk.yellow(`⚠️  No Wikipedia article found for "${subject}"`));
                console.log(chalk.yellow(`⏱️  Search API time: ${searchTime}ms`));
                console.log(chalk.yellow(`⏱️  Total execution time: ${toolTime}ms`));
                console.log(chalk.magenta("=".repeat(80) + "\n"));
                return `I couldn't find any Wikipedia article about "${subject}". Please respond based on your existing knowledge, or let the user know you don't have information on this topic.`;
            }

            console.log(chalk.green(`✅ Found Wikipedia article: "${topArticle.title}"`));
            console.log(chalk.yellow(`⏱️  Search API time: ${searchTime}ms`));
            console.log(chalk.blue(`📝 Article length: ${topArticle.extract.length} characters`));

            // Use Gemma summarizer to create a concise summary
            console.log(chalk.blue("[Gemma270M] Summarizing article..."));
            const summarizeStart = Date.now();
            
            const summary = await articleSummarizer({
                topic: subject,
                article: topArticle.extract,
                sourceUrl: topArticle.url
            });
            
            const summaryTime = Date.now() - summarizeStart;
            console.log(chalk.green(`[Gemma270M] Summary ready in ${summaryTime}ms`));

            // Format the response
            const formattedResult = `${summary}\n\nSource: ${topArticle.url}`;

            const toolTime = Date.now() - toolStartTime;
            console.log(chalk.yellow(`⏱️  Total execution time: ${toolTime}ms`));
            console.log(chalk.cyan(`📝 Summary length: ${summary.length} characters`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));

            return formattedResult;
        } catch (error) {
            const toolTime = Date.now() - toolStartTime;
            const errorMessage = error instanceof Error ? error.message : "Unknown error during general knowledge lookup";
            console.log(chalk.red("❌ Tool execution failed"));
            console.log(chalk.red("Error:"), errorMessage);
            if (error instanceof Error && error.stack) {
                console.log(chalk.red("Stack trace:"), error.stack);
            }
            console.log(chalk.yellow(`⏱️  Execution time: ${toolTime}ms`));
            console.log(chalk.magenta("=".repeat(80) + "\n"));
            return `Error looking up information about "${subject}": ${errorMessage}`;
        }
    }
});

/**
 * Export all functions as an object to pass to session.prompt()
 */
export const functions = {
    web_search: webSearchFunction,
    wikipedia_search: wikipediaSearchFunction,
    general_knowledge: generalKnowledgeFunction
};

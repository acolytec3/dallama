import { defineChatSessionFunction } from "node-llama-cpp";
import chalk from "chalk";
import { braveWebSearch } from "../braveSearch.js";
import { searchWikipediaWithDetails } from "../wikipediaSearch.js";
import type { ArticleSummarizer } from "../gemmaSummarizer.js";

// Callback for tool call notifications
let toolCallCallback: ((toolName: string) => void) | null = null;
let articleSummarizer: ArticleSummarizer | null = null;

// Track if Wikipedia search was already called in the current request
let wikipediaSearchCalledThisRequest = false;

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
    wikipediaSearchCalledThisRequest = false;
}

/**
 * Register a secondary model-based summarizer used to condense long articles
 */
export function registerArticleSummarizer(summarizer: ArticleSummarizer) {
    articleSummarizer = summarizer;
}

/**
 * Define the web_search function using node-llama-cpp's native function calling API
 */
export const webSearchFunction = defineChatSessionFunction({
    description: "Search the web for current information, news, facts, weather, or any topic. ALWAYS use this tool when users ask about: current weather, recent news, real-time information, current events, or anything requiring up-to-date data. Use this tool whenever you don't have current information or when the user explicitly asks you to search. This is your PRIMARY way to get current, accurate information.",
    params: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "The search query to look up on the web"
            }
        },
        required: ["query"]
    },
    async handler(params) {
        const toolStartTime = Date.now();
        const { query } = params;

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

            // Format results for the LLM
            let formattedResults = "";

            // If we have a top article with detailed extract, use that as the primary content
            if (topArticle && topArticle.extract) {
                let summarized = "";
                let summaryTimeMs: number | null = null;
                if (articleSummarizer) {
                    try {
                        console.log(chalk.blue("[Gemma270M] Summarizing article for main model..."));
                        const summarizeStart = Date.now();
                        summarized = await articleSummarizer({
                            topic: keyword,
                            article: topArticle.extract,
                            sourceUrl: topArticle.url
                        });
                        summaryTimeMs = Date.now() - summarizeStart;
                        console.log(chalk.green(`[Gemma270M] Summary ready in ${summaryTimeMs}ms`));
                    } catch (error) {
                        console.log(chalk.yellow("[Gemma270M] Summary failed, falling back to raw extract"), error);
                    }
                }

                if (summarized) {
                    formattedResults += `Wikipedia Article Summary (Gemma 270M): ${topArticle.title}\n\n`;
                    formattedResults += `${summarized}\n\n`;
                    formattedResults += `Original Source: ${topArticle.url}\n`;
                    if (summaryTimeMs !== null) {
                        formattedResults += `Summarization time (ms): ${summaryTimeMs}\n`;
                    }
                    formattedResults += "\n";
                } else {
                    formattedResults += `Wikipedia Article: ${topArticle.title}\n\n`;
                    formattedResults += `${topArticle.extract}\n\n`;
                    formattedResults += `Source: ${topArticle.url}\n\n`;
                }
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
 * Export all functions as an object to pass to session.prompt()
 */
export const functions = {
    web_search: webSearchFunction,
    wikipedia_search: wikipediaSearchFunction
};

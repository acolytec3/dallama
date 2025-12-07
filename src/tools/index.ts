import { defineChatSessionFunction } from "node-llama-cpp";
import chalk from "chalk";
import { braveWebSearch } from "../braveSearch.js";

// Callback for tool call notifications
let toolCallCallback: ((toolName: string) => void) | null = null;

/**
 * Set a callback to be notified when a tool is called
 */
export function setToolCallCallback(callback: (toolName: string) => void) {
    toolCallCallback = callback;
}

/**
 * Clear the tool call callback
 */
export function clearToolCallCallback() {
    toolCallCallback = null;
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
 * Export all functions as an object to pass to session.prompt()
 */
export const functions = {
    web_search: webSearchFunction
};

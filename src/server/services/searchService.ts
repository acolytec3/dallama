import { WikipediaSearchResult, SearchRequest, SearchResponse } from '../types/index.js';

export class WikipediaSearchService {
    private baseUrl = 'https://en.wikipedia.org/api/rest_v1';
    private actionApiUrl = 'https://en.wikipedia.org/w/api.php';
    private userAgent = 'Dallama-AI-Assistant/1.0';

    async search(request: SearchRequest): Promise<SearchResponse> {
        const { query, maxResults = 5 } = request;

        try {
            // Use MediaWiki Action API for search
            const response = await fetch(
                `${this.actionApiUrl}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${maxResults}`,
                {
                    headers: { 'User-Agent': this.userAgent }
                }
            );

            if (!response.ok) {
                throw new Error(`Wikipedia API error: ${response.status}`);
            }

            const data = await response.json() as any;

            if (!data.query || !data.query.search) {
                return {
                    results: [],
                    query,
                    timestamp: new Date().toISOString()
                };
            }

            const results: WikipediaSearchResult[] = data.query.search.map((item: any) => ({
                title: item.title,
                snippet: item.snippet,
                pageId: item.pageid.toString(),
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`
            }));

            return {
                results,
                query,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Wikipedia search error:', error);
            throw new Error(`Failed to search Wikipedia: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getPageSummary(pageTitle: string): Promise<string> {
        try {
            // Use Wikimedia REST API for page summaries
            const response = await fetch(
                `${this.baseUrl}/page/summary/${encodeURIComponent(pageTitle)}`,
                {
                    headers: { 'User-Agent': this.userAgent }
                }
            );

            if (!response.ok) {
                throw new Error(`Wikipedia API error: ${response.status}`);
            }

            const data = await response.json() as any;
            return data.extract || '';
        } catch (error) {
            console.error('Wikipedia summary error:', error);
            throw new Error(`Failed to get Wikipedia summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getPageContent(pageId: string): Promise<string> {
        try {
            // Get page content using MediaWiki API
            const response = await fetch(
                `${this.actionApiUrl}?action=query&pageids=${pageId}&prop=extracts&exintro=true&explaintext=true&format=json`,
                {
                    headers: { 'User-Agent': this.userAgent }
                }
            );

            if (!response.ok) {
                throw new Error(`Wikipedia API error: ${response.status}`);
            }

            const data = await response.json() as any;

            if (data.query && data.query.pages && data.query.pages[pageId]) {
                return data.query.pages[pageId].extract || '';
            }

            return '';
        } catch (error) {
            console.error('Wikipedia content error:', error);
            throw new Error(`Failed to get Wikipedia content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    isSearchPrompt(text: string): boolean {
        // Check if the prompt starts with 'search for' (case-insensitive, allows leading whitespace)
        if (/^\s*search for\s/i.test(text)) {
            return true;
        }

        // Check for factual questions that would benefit from Wikipedia search
        const factualPatterns = [
            /what is (?:a |an |the )?([^?]+)\?/i,
            /tell me about ([^?]+)/i,
            /who is ([^?]+)/i,
            /where is ([^?]+)/i,
            /when did ([^?]+)/i,
            /how does ([^?]+)/i,
            /explain ([^?]+)/i,
            /describe ([^?]+)/i,
            /^([^?]+) facts?/i,
            /^([^?]+) information/i,
            /^([^?]+) details/i
        ];

        return factualPatterns.some(pattern => pattern.test(text));
    }

    extractSearchQuery(text: string): string {
        // Extract the query after 'search for'
        const searchForMatch = text.match(/^\s*search for\s+(.*)$/i);
        if (searchForMatch && searchForMatch[1]) {
            return searchForMatch[1].trim();
        }

        // Extract query from factual questions
        const factualPatterns = [
            { pattern: /what is (?:a |an |the )?([^?]+)\?/i, group: 1 },
            { pattern: /tell me about ([^?]+)/i, group: 1 },
            { pattern: /who is ([^?]+)/i, group: 1 },
            { pattern: /where is ([^?]+)/i, group: 1 },
            { pattern: /when did ([^?]+)/i, group: 1 },
            { pattern: /how does ([^?]+)/i, group: 1 },
            { pattern: /explain ([^?]+)/i, group: 1 },
            { pattern: /describe ([^?]+)/i, group: 1 },
            { pattern: /^([^?]+) facts?/i, group: 1 },
            { pattern: /^([^?]+) information/i, group: 1 },
            { pattern: /^([^?]+) details/i, group: 1 }
        ];

        for (const { pattern, group } of factualPatterns) {
            const match = text.match(pattern);
            if (match && match[group]) {
                return match[group].trim();
            }
        }

        return '';
    }
}

// Export singleton instance
export const wikipediaSearchService = new WikipediaSearchService();

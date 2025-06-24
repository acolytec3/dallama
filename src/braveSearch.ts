let lastQueryTime = 0;

export interface BraveSearchResult {
    title: string;
    url: string;
    description: string;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function isWebSearchPrompt(text: string): boolean {
    // Returns true if the prompt starts with 'search for' (case-insensitive, allowing leading whitespace)
    return /^\s*search for\b/i.test(text);
}

export async function braveWebSearch(query: string, options?: { count?: number }): Promise<BraveSearchResult[]> {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
        throw new Error('Brave Search API key not set. Please set BRAVE_SEARCH_API_KEY in your environment.');
    }

    // Rate limiting: ensure at least 1 second between queries
    const now = Date.now();
    const elapsed = now - lastQueryTime;
    if (elapsed < 1000) {
        await sleep(1000 - elapsed);
    }
    lastQueryTime = Date.now();

    const count = options?.count ?? 5;
    const endpoint = `https://api.search.brave.com/res/v1/web/search`;
    const params = new URLSearchParams({ q: query, count: String(count) });

    const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': apiKey,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brave Search API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as any;
    if (!data.web || !Array.isArray(data.web.results)) {
        throw new Error('Unexpected Brave Search API response format');
    }

    return data.web.results.map((item: any) => ({
        title: item.title,
        url: item.url,
        description: item.description || item.snippet || '',
    }));
} 
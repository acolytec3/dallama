export interface WikipediaSearchResult {
    title: string;
    pageId: number;
    snippet: string;
    url: string;
}

export interface WikipediaArticle {
    title: string;
    extract: string;
    url: string;
    pageId: number;
}

/**
 * Search Wikipedia for articles matching a keyword
 */
export async function searchWikipedia(keyword: string, options?: { limit?: number }): Promise<WikipediaSearchResult[]> {
    const limit = options?.limit ?? 5;
    const endpoint = `https://en.wikipedia.org/w/api.php`;

    // First, search for pages matching the keyword
    const searchParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: keyword,
        srlimit: String(limit),
        format: 'json',
        origin: '*'
    });

    console.log(`[WikipediaSearch] Searching for: "${keyword}"`);

    try {
        const searchResponse = await fetch(`${endpoint}?${searchParams.toString()}`);

        if (!searchResponse.ok) {
            throw new Error(`Wikipedia API error: ${searchResponse.status} ${searchResponse.statusText}`);
        }

        const searchData = await searchResponse.json() as any;

        if (!searchData.query || !Array.isArray(searchData.query.search)) {
            console.error('[WikipediaSearch] Unexpected API response format', searchData);
            return [];
        }

        const results: WikipediaSearchResult[] = searchData.query.search.map((item: any) => ({
            title: item.title,
            pageId: item.pageid,
            snippet: item.snippet || '',
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
        }));

        console.log(`[WikipediaSearch] Found ${results.length} results`);
        if (results.length > 0 && results[0]) {
            console.log(`[WikipediaSearch] First result: ${results[0].title}`);
        }

        return results;
    } catch (error) {
        console.error('[WikipediaSearch] Error:', error);
        throw error;
    }
}

/**
 * Get the full article content or extract for a Wikipedia page
 * @param title - The title of the Wikipedia article
 * @param options - Options for retrieving the article
 * @param options.fullArticle - If true, retrieves the full article text. If false, retrieves only the intro (default: false)
 * @param options.maxChars - Maximum number of characters to retrieve (only used if fullArticle is false, default: 1000)
 */
export async function getWikipediaArticle(
    title: string,
    options?: { fullArticle?: boolean; maxChars?: number }
): Promise<WikipediaArticle | null> {
    const endpoint = `https://en.wikipedia.org/w/api.php`;
    const fullArticle = options?.fullArticle ?? false;
    const maxChars = options?.maxChars ?? 1000;

    const params = new URLSearchParams({
        action: 'query',
        prop: 'extracts|info',
        explaintext: 'true',
        titles: title,
        format: 'json',
        inprop: 'url',
        origin: '*'
    });

    // Only limit characters/intro if not requesting full article
    if (!fullArticle) {
        params.append('exintro', 'true');
        params.append('exchars', String(maxChars));
    }

    console.log(`[WikipediaSearch] Fetching article: "${title}"`);

    try {
        const response = await fetch(`${endpoint}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Wikipedia API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;

        if (!data.query || !data.query.pages) {
            return null;
        }

        const pages = Object.values(data.query.pages) as any[];
        if (pages.length === 0 || pages[0].missing) {
            return null;
        }

        const page = pages[0];
        const article: WikipediaArticle = {
            title: page.title,
            extract: page.extract || '',
            url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
            pageId: page.pageid
        };

        // Log whether we fetched the full article and a short preview
        const extractPreview = article.extract.slice(0, 300).replace(/\s+/g, ' ');
        console.log(`[WikipediaSearch] Retrieved ${fullArticle ? "full article" : "intro"} for "${article.title}". Preview (300 chars): ${extractPreview}`);

        return article;
    } catch (error) {
        console.error('[WikipediaSearch] Error fetching article:', error);
        throw error;
    }
}

/**
 * Search Wikipedia and get detailed information for the top result
 * @param keyword - The keyword to search for
 * @param options - Options for the search
 * @param options.limit - Maximum number of search results to return (default: 5)
 * @param options.fullArticle - If true, retrieves the full article text for the top result. If false, retrieves only the intro (default: false)
 * @param options.maxChars - Maximum number of characters to retrieve for the top article (only used if fullArticle is false, default: 1000)
 */
export async function searchWikipediaWithDetails(
    keyword: string,
    options?: { limit?: number; fullArticle?: boolean; maxChars?: number }
): Promise<{
    searchResults: WikipediaSearchResult[];
    topArticle?: WikipediaArticle;
}> {
    const searchResults = await searchWikipedia(keyword, { limit: options?.limit });

    if (searchResults.length === 0) {
        return { searchResults: [] };
    }

    // Get detailed information for the top result
    let topArticle: WikipediaArticle | undefined;
    try {
        const firstResult = searchResults[0];
        if (!firstResult) {
            return { searchResults };
        }
        const article = await getWikipediaArticle(firstResult.title, {
            fullArticle: options?.fullArticle,
            maxChars: options?.maxChars
        });
        if (article) {
            topArticle = article;
        }
    } catch (error) {
        console.error('[WikipediaSearch] Error fetching top article details:', error);
        // Continue without top article details
    }

    return {
        searchResults,
        topArticle
    };
}









import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import chalk from 'chalk';
import { wikipediaSearchService } from '../services/searchService.js';
import { SearchRequest, SearchResponse } from '../types/index.js';

export async function searchRoutes(fastify: FastifyInstance) {
    // Wikipedia search endpoint
    fastify.post('/search', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const searchRequest = request.body as SearchRequest;

            if (!searchRequest.query || searchRequest.query.trim() === "") {
                return reply.status(400).send({
                    error: "No search query provided",
                    message: "Please provide a search query in the request body"
                });
            }

            console.log(chalk.blue(`Performing Wikipedia search for: "${searchRequest.query}"`));

            const searchResponse = await wikipediaSearchService.search(searchRequest);

            return searchResponse;

        } catch (error) {
            console.error(chalk.red("Error performing search:"), error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });

    // Get Wikipedia page summary
    fastify.get('/search/summary/:pageTitle', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { pageTitle } = request.params as { pageTitle: string };

            if (!pageTitle || pageTitle.trim() === "") {
                return reply.status(400).send({
                    error: "No page title provided",
                    message: "Please provide a Wikipedia page title"
                });
            }

            console.log(chalk.blue(`Getting Wikipedia summary for: "${pageTitle}"`));

            const summary = await wikipediaSearchService.getPageSummary(pageTitle);

            return {
                pageTitle,
                summary,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(chalk.red("Error getting Wikipedia summary:"), error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });

    // Get Wikipedia page content
    fastify.get('/search/content/:pageId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { pageId } = request.params as { pageId: string };

            if (!pageId || pageId.trim() === "") {
                return reply.status(400).send({
                    error: "No page ID provided",
                    message: "Please provide a Wikipedia page ID"
                });
            }

            console.log(chalk.blue(`Getting Wikipedia content for page ID: "${pageId}"`));

            const content = await wikipediaSearchService.getPageContent(pageId);

            return {
                pageId,
                content,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(chalk.red("Error getting Wikipedia content:"), error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    });
}


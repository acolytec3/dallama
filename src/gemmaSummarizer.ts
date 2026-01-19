import chalk from "chalk";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";

export type ArticleSummarizer = (input: {
    topic: string;
    article: string;
    sourceUrl?: string;
}) => Promise<string>;

/**
 * Create a lightweight summarizer backed by the Gemma 270M instruction-tuned model.
 * The summarizer is designed to condense long Wikipedia articles into a compact
 * form that the primary model can reason over quickly.
 */
export async function createGemmaSummarizer(
    modelsDirectory: string,
    llamaInstance?: Awaited<ReturnType<typeof getLlama>>,
    options?: { modelName?: string }
): Promise<ArticleSummarizer> {
    const modelName = options?.modelName ?? "gemma-3-270m-it-IQ4_XS.gguf";

    const llama = llamaInstance ?? await getLlama({ gpu: false });

    console.log(chalk.yellow(`\n[Gemma270M] Resolving model file: ${modelName}...`));
    const modelPath = await resolveModelFile(modelName, modelsDirectory);

    console.log(chalk.yellow("[Gemma270M] Loading model..."));
    const model = await llama.loadModel({ modelPath });

    /**
     * Summarize a Wikipedia article and produce a direct answer to the user's query
     */
    return async ({ topic, article, sourceUrl }: { topic: string; article: string; sourceUrl?: string }) => {
        const context = await model.createContext({ contextSize: 4096 });
        const session = new LlamaChatSession({
            contextSequence: context.getSequence(),
        });

        const systemPrompt = `You are a very concise research assistant. Your job is to digest long Wikipedia content and produce a direct answer to the user's question.
- Give a short direct answer to the user's question; if insufficient info, say that.
- Avoid speculation.`;

        await session.prompt(systemPrompt);

        const prompt = `User question: ${topic}

Wikipedia article:
${article}

Write the concise summary.`;

        const summary = await session.prompt(prompt, {
            maxTokens: 256,
            temperature: 0.2,
            topP: 0.9,
            repeatPenalty: { penalty: 1.05 },
        });

        const sourceLine = sourceUrl ? `\nSource: ${sourceUrl}` : "";
        return `${summary}${sourceLine}`;
    };
}


import { fileURLToPath } from "url";
import path from "path";
import * as fs from "fs";
import { createInterface } from "readline/promises";
import chalk from "chalk";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";




const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "..", "models");

const read = createInterface({
    input: process.stdin,
    output: process.stdout
});
const llama = await getLlama({ gpu: false });

console.log(chalk.yellow("Resolving model file..."));
const modelPath = await resolveModelFile(
    "hf:bartowski/gemma-2-2b-it-GGUF/gemma-2-2b-it-Q6_K_L.gguf",
    modelsDirectory
);

console.log(chalk.yellow("Loading model..."));
const model = await llama.loadModel({ modelPath });

console.log(chalk.yellow("Creating context..."));
const context = await model.createContext();

// const q = await read.question(chalk.yellow("What persona should your agent take?>>: "));
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    // systemPrompt: q
});
console.log();

process.on("SIGINT", () => {
    console.log(chalk.red("Exiting..."));
    process.exit(0);
});

while (true) {
    const q = await read.question(chalk.yellow(">>: "));

    process.stdout.write(chalk.yellow("AI: "));
    const response = await session.prompt(q, {
        onTextChunk(chunk) {
            // stream the response to the console as it's being generated
            process.stdout.write(chunk);
        }
    });
    console.log(response)
    process.stdout.write("\n");
}


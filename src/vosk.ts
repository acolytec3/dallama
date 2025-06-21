import path from "path";
import { fileURLToPath } from "url";
import Fastify from "fastify";
import * as vosk from "vosk-lib";

import chalk from "chalk";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "..", "models");


const llama = await getLlama();

console.log(chalk.yellow("Resolving model file..."));
const modelPath = await resolveModelFile(
    "hf:bartowski/gemma-2-2b-it-GGUF/gemma-2-2b-it-Q6_K_L.gguf",
    modelsDirectory
);

console.log(chalk.yellow("Loading model..."));
const llm = await llama.loadModel({ modelPath });

console.log(chalk.yellow("Creating context..."));
const context = await llm.createContext();


const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    // systemPrompt: q
});
const modelDir = "./models/vosk-model-small-en-us-0.15";

const model = new vosk.Model(modelDir);

const fastify = Fastify({ logger: false });

fastify.get("/", () => {
    return {
        message: "Hello from vosk"
    }
})

fastify.addContentTypeParser("application/octet-stream", { parseAs: "buffer" }, function (req, body, done) {
    done(null, body)
})

fastify.post("/transcribe", async (request) => {
    if (request.body === null) {
        return {
            code: 400,
            message: "nothing received"
        }
    }

    const bytes = request

    const rec = new vosk.Recognizer({ model: model, sampleRate: 16000 });
    const result = await rec.acceptWaveformAsync(bytes.body as Buffer);

    const q = rec.result()
    console.log(q.text)

    if (q.text !== undefined) {
        const response = await session.prompt(q.text);

        return {
            message: response
        }
    }
})

process.on("SIGINT", () => {
    console.log("Shutting down server")
    process.exit(0)
})


const main = async () => {
    await fastify.listen({ port: 3000 }, async (err, address) => {
        console.log("Server is running on port 3000")

    })

}
main();

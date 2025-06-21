import { Context, DeviceType } from "playcap";
import * as vosk from "vosk-lib";

const modelDir = "./models/vosk-model-small-en-us-0.15";

const model = new vosk.Model(modelDir);

const SAMPLE_RATE = 16000
const BIT_DEPTH = 16
const scaler = Math.pow(2, BIT_DEPTH) / 2
const ctx = new Context()

const clamp = (val: number) => {
    if (val > 1) {
        return 1
    }
    if (val < -1) {
        return -1
    }
    return val
}
const device = ctx.createDevice({ sampleRate: SAMPLE_RATE, deviceType: DeviceType.Capture, captureChannels: 1 }, async (input, output) => {
    const buf = Buffer.alloc(input[0]!.length * (BIT_DEPTH / 8))
    for (let i = 0; i < input[0]!.length; i++) {
        const sample = clamp(input[0]![i]!)
        const val = (sample * scaler) | 0
        buf.writeInt16LE(val, i * 2)
    }
    console.log('buf', buf)

    const rec = new vosk.Recognizer({ model: model, sampleRate: 16000 });
    const result = await rec.acceptWaveformAsync(buf);

    const q = rec.result()
    if (q.text) console.log(q.text)
})

console.log('listening...')
device.start()


process.on('SIGINT', () => {
    device.destroy()

    console.log('exit')

    process.exit()
})
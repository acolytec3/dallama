import chalk from 'chalk';
import { config } from './config.js';

export class WakeWordDetector {
    private enabled: boolean;
    private phrase: string;
    private sensitivity: number;
    private isListening: boolean = false;

    constructor() {
        this.enabled = config.wakeWord.enabled;
        this.phrase = config.wakeWord.phrase;
        this.sensitivity = config.wakeWord.sensitivity;
    }

    async initialize(): Promise<void> {
        try {
            console.log(chalk.yellow('Initializing wake word detector...'));

            if (!this.enabled) {
                console.log(chalk.yellow('Wake word detection is disabled'));
                return;
            }

            // In a real implementation, this would:
            // 1. Load Porcupine or openWakeWord model
            // 2. Initialize audio input
            // 3. Set up keyword detection

            console.log(chalk.blue(`Wake phrase: "${this.phrase}"`));
            console.log(chalk.blue(`Sensitivity: ${this.sensitivity}`));

            console.log(chalk.green('Wake word detector initialized successfully'));
        } catch (error) {
            console.error(chalk.red('Failed to initialize wake word detector:'), error);
            throw error;
        }
    }

    async startListening(): Promise<void> {
        if (!this.enabled) {
            console.log(chalk.yellow('Wake word detection is disabled, skipping...'));
            return;
        }

        try {
            console.log(chalk.blue('Starting wake word detection...'));
            this.isListening = true;

            // In a real implementation, this would:
            // 1. Start continuous audio monitoring
            // 2. Process audio chunks for wake word detection
            // 3. Trigger callback when wake word is detected

            console.log(chalk.green('Wake word detection started'));
        } catch (error) {
            console.error(chalk.red('Error starting wake word detection:'), error);
            throw error;
        }
    }

    async stopListening(): Promise<void> {
        try {
            console.log(chalk.blue('Stopping wake word detection...'));
            this.isListening = false;

            // In a real implementation, this would stop audio monitoring

            console.log(chalk.green('Wake word detection stopped'));
        } catch (error) {
            console.error(chalk.red('Error stopping wake word detection:'), error);
            throw error;
        }
    }

    onWakeWord(callback: () => void): void {
        if (!this.enabled) {
            console.log(chalk.yellow('Wake word detection is disabled'));
            return;
        }

        // In a real implementation, this would register the callback
        // For now, we'll simulate wake word detection after 10 seconds
        setTimeout(() => {
            if (this.isListening) {
                console.log(chalk.magenta(`Wake word detected: "${this.phrase}"`));
                callback();
            }
        }, 10000);
    }

    isActive(): boolean {
        return this.isListening;
    }

    getPhrase(): string {
        return this.phrase;
    }

    getSensitivity(): number {
        return this.sensitivity;
    }
}



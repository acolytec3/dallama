# Pi4 Voice Assistant

A headless voice assistant application for Raspberry Pi 4 that provides Alexa-style voice interactions with your AI assistant.

## Features

- **Wake Word Detection**: Responds to "Hey Assistant" trigger phrase
- **Voice Activity Detection**: Automatically detects speech start/end
- **Audio I/O**: Microphone input and speaker output
- **AI Integration**: Connects to the main AI server for processing
- **Text-to-Speech**: Plays AI responses through speakers
- **Systemd Service**: Auto-starts on boot

## Hardware Requirements

- Raspberry Pi 4 (2GB+ RAM recommended)
- USB microphone or Pi microphone HAT
- Speaker output (3.5mm jack or USB speakers)
- Optional: LED indicator for status

## Software Requirements

- Raspberry Pi OS Lite
- Node.js 18+
- ALSA audio system

## Installation

1. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Configure audio**:
   ```bash
   # Test microphone
   arecord -l
   
   # Test speakers
   speaker-test -t wav -c 2
   ```

5. **Install systemd service**:
   ```bash
   npm run install-service
   npm run enable-service
   ```

## Configuration

Create a `.env` file in the project root:

```env
# Server Configuration
SERVER_URL=http://192.168.1.100:3000
SERVER_TIMEOUT=30000

# Audio Configuration
AUDIO_INPUT_DEVICE=default
AUDIO_OUTPUT_DEVICE=default
AUDIO_SAMPLE_RATE=16000
AUDIO_CHANNELS=1

# Wake Word Configuration
WAKE_WORD_ENABLED=true
WAKE_WORD_PHRASE=hey assistant
WAKE_WORD_SENSITIVITY=0.5

# VAD Configuration
VAD_ENABLED=true
VAD_SILENCE_THRESHOLD=0.3
VAD_MIN_SPEECH_DURATION=1000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/voice-assistant.log
```

## Usage

### Manual Start
```bash
npm start
```

### Service Management
```bash
# Start service
npm run start-service

# Stop service
npm run stop-service

# Check status
npm run status-service
```

### Development
```bash
npm run dev
```

## Voice Interaction Flow

1. **Wake Word Detection**: Continuously listens for "Hey Assistant"
2. **Wake Sound**: Plays confirmation sound when wake word detected
3. **Speech Recording**: Records user speech using VAD
4. **AI Processing**: Sends transcribed text to AI server
5. **TTS Generation**: Generates speech from AI response
6. **Audio Playback**: Plays response through speakers

## Troubleshooting

### Audio Issues
```bash
# Check audio devices
arecord -l
aplay -l

# Test microphone
arecord -f cd -d 5 test.wav
aplay test.wav

# Check ALSA configuration
cat /proc/asound/cards
```

### Service Issues
```bash
# Check service logs
sudo journalctl -u voice-assistant -f

# Restart service
sudo systemctl restart voice-assistant

# Check service status
sudo systemctl status voice-assistant
```

### Network Issues
```bash
# Test server connection
curl http://192.168.1.100:3000/health

# Check network connectivity
ping 192.168.1.100
```

## Development Notes

This is a mock implementation that simulates voice interactions. For production use, you would need to:

1. **Integrate Real Wake Word Detection**: Use Porcupine or openWakeWord
2. **Implement Real VAD**: Use libfvad or open-voice-activity-detection
3. **Add Real Audio Processing**: Use ALSA or PulseAudio
4. **Implement STT**: Send audio to Whisper or similar service
5. **Add Real TTS**: Integrate with Kokoro or similar service

## Security Considerations

- The service runs as the `pi` user with limited privileges
- Audio data is processed locally and not stored
- Network communication uses HTTPS in production
- Systemd service includes security restrictions

## License

MIT License - see LICENSE file for details.


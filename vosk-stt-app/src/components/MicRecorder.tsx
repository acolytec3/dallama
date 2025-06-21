import { useRef, useState } from "react";
import { Button, Text, VStack } from "@chakra-ui/react";

interface MicRecorderProps {
  onAudio: (audioBuffer: AudioBuffer) => void;
}

const MicRecorder = ({ onAudio }: MicRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handleStart = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        audioChunks.current = [];
        
        // Convert to 16kHz mono AudioBuffer for Vosk
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Convert to mono if needed
        let monoBuffer = audioBuffer;
        if (audioBuffer.numberOfChannels > 1) {
          monoBuffer = audioContext.createBuffer(1, audioBuffer.length, 16000);
          const monoData = monoBuffer.getChannelData(0);
          
          // Mix all channels to mono
          for (let i = 0; i < audioBuffer.length; i++) {
            let sum = 0;
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
              sum += audioBuffer.getChannelData(channel)[i];
            }
            monoData[i] = sum / audioBuffer.numberOfChannels;
          }
        }
        
        onAudio(monoBuffer);
      };
      mediaRecorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied or not available.");
    }
  };

  const handleStop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <VStack gap={4}>
      <Button colorScheme={recording ? "red" : "blue"} onClick={recording ? handleStop : handleStart} size="lg">
        {recording ? "Stop Recording" : "Start Recording"}
      </Button>
      {error && (
        <Text color="red.500" fontSize="sm">{error}</Text>
      )}
      <Text fontSize="sm" color="gray.500">
        {recording ? "Recording..." : "Press to record your voice."}
      </Text>
    </VStack>
  );
};

export default MicRecorder; 
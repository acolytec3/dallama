import { useRef, useState } from "react";
import { Button, Text, VStack } from "@chakra-ui/react";

interface MicRecorderProps {
  onAudio: (audioBuffer: ArrayBuffer) => void;
}

const MicRecorder = ({ onAudio }: MicRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handleStart = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        audioChunks.current = [];
        audioBlob.arrayBuffer().then(onAudio);
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
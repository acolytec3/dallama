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
    <VStack gap={{ base: 4, md: 6 }} w="100%" maxW="100%">
      <Button 
        bg={recording ? "red.500" : "blue.500"}
        color="white"
        onClick={recording ? handleStop : handleStart} 
        size={{ base: "lg", md: "xl" }}
        h={{ base: "60px", md: "70px" }}
        w={{ base: "200px", md: "250px" }}
        fontSize={{ base: "lg", md: "xl" }}
        fontWeight="bold"
        borderRadius="full"
        boxShadow="lg"
        _hover={{
          bg: recording ? "red.600" : "blue.600",
          transform: "translateY(-2px)",
          boxShadow: "xl"
        }}
        _active={{
          bg: recording ? "red.700" : "blue.700",
          transform: "translateY(0px)"
        }}
        transition="all 0.2s"
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </Button>
      
      {error && (
        <Text 
          color="red.600" 
          fontSize={{ base: "sm", md: "md" }}
          textAlign="center"
          bg="red.50"
          p={3}
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
          w="100%"
          maxW="100%"
        >
          {error}
        </Text>
      )}
      
      <Text 
        fontSize={{ base: "md", md: "lg" }} 
        color="gray.700"
        textAlign="center"
        fontWeight="medium"
        maxW="100%"
      >
        {recording ? "Recording..." : "Press to record your voice."}
      </Text>
    </VStack>
  );
};

export default MicRecorder; 
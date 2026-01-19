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
        
        // Decode the audio (browser may use native sample rate like 48kHz)
        const audioContext = new AudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        console.log("Decoded audio:", {
          sampleRate: decodedBuffer.sampleRate,
          channels: decodedBuffer.numberOfChannels,
          length: decodedBuffer.length,
          duration: decodedBuffer.duration
        });
        
        // Get mono channel data (mix if stereo)
        let monoData: Float32Array;
        if (decodedBuffer.numberOfChannels === 1) {
          monoData = decodedBuffer.getChannelData(0);
        } else {
          monoData = new Float32Array(decodedBuffer.length);
          for (let i = 0; i < decodedBuffer.length; i++) {
            let sum = 0;
            for (let ch = 0; ch < decodedBuffer.numberOfChannels; ch++) {
              sum += decodedBuffer.getChannelData(ch)[i];
            }
            monoData[i] = sum / decodedBuffer.numberOfChannels;
          }
        }
        
        // Resample to 16kHz if needed
        let resampledData = monoData;
        const sourceSampleRate = decodedBuffer.sampleRate;
        if (sourceSampleRate !== 16000) {
          console.log(`Resampling from ${sourceSampleRate}Hz to 16000Hz`);
          const ratio = sourceSampleRate / 16000;
          const newLength = Math.floor(monoData.length / ratio);
          resampledData = new Float32Array(newLength);
          for (let i = 0; i < newLength; i++) {
            const srcIndex = Math.floor(i * ratio);
            resampledData[i] = monoData[srcIndex];
          }
        }
        
        // Create 16kHz mono AudioBuffer for Vosk
        const targetContext = new AudioContext({ sampleRate: 16000 });
        const monoBuffer = targetContext.createBuffer(1, resampledData.length, 16000);
        monoBuffer.copyToChannel(resampledData, 0);
        
        console.log("Final audio buffer for Vosk:", {
          sampleRate: monoBuffer.sampleRate,
          channels: monoBuffer.numberOfChannels,
          length: monoBuffer.length,
          duration: monoBuffer.duration
        });
        
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
    <VStack gap={{ base: 2, md: 3 }} w="100%" maxW="100%">
      <Button 
        bg={recording ? "red.500" : "blue.500"}
        color="white"
        onClick={recording ? handleStop : handleStart} 
        size={{ base: "md", md: "lg" }}
        h={{ base: "50px", md: "60px" }}
        w={{ base: "160px", md: "200px" }}
        fontSize={{ base: "sm", md: "md" }}
        fontWeight="bold"
        borderRadius="full"
        boxShadow="md"
        _hover={{
          bg: recording ? "red.600" : "blue.600",
          transform: "translateY(-1px)",
          boxShadow: "lg"
        }}
        _active={{
          bg: recording ? "red.700" : "blue.700",
          transform: "translateY(0px)"
        }}
        transition="all 0.2s"
      >
        {recording ? "Stop" : "Record"}
      </Button>
      
      {error && (
        <Text 
          color="red.600" 
          fontSize={{ base: "xs", md: "sm" }}
          textAlign="center"
          bg="red.50"
          p={2}
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
        fontSize={{ base: "xs", md: "sm" }} 
        color="gray.700"
        textAlign="center"
        fontWeight="medium"
        maxW="100%"
      >
        {recording ? "Recording..." : "Tap to record"}
      </Text>
    </VStack>
  );
};

export default MicRecorder; 
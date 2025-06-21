import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import ModelLoader from "./components/ModelLoader";
import MicRecorder from "./components/MicRecorder";

export default function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  // Use 'unknown' for model type, assert as needed
  const [model, setModel] = useState<unknown>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const handleAudio = async (audioBuffer: AudioBuffer) => {
    if (!model) return;
    setRecognizing(true);
    setError(null);
    setTranscript("");
    setDebugInfo(`Audio buffer: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.length} samples, ${audioBuffer.sampleRate}Hz`);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognizer = new (model as any).KaldiRecognizer(16000);
      console.log("Recognizer created successfully");
      
      recognizer.acceptWaveform(audioBuffer);
      console.log("Audio sent to recognizer");
      
      // Set up event listeners for results
      recognizer.on("result", (message: { result: { text: string } }) => {
        console.log("Final result:", message);
        if (message.result && message.result.text) {
          setTranscript(message.result.text);
          setDebugInfo(`Success! Recognized: "${message.result.text}"`);
        }
        recognizer.remove();
      });
      
      recognizer.on("partialresult", (message: { result: { partial: string } }) => {
        console.log("Partial result:", message);
        if (message.result && message.result.partial) {
          setTranscript(message.result.partial);
          setDebugInfo(`Partial: "${message.result.partial}"`);
        }
      });
      
    } catch (err) {
      console.error("Recognition error:", err);
      setError(`Recognition failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setDebugInfo(`Error details: ${JSON.stringify(err)}`);
    } finally {
      setRecognizing(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" p={4}>
      <Stack gap={8} alignItems="center" direction="column">
        <Heading as="h1" size="lg" mt={8}>
          Vosk STT Mobile Web App
        </Heading>
        {!modelLoaded && <ModelLoader onReady={(m) => { setModel(m); setModelLoaded(true); }} />}
        {modelLoaded && (
          <>
            <MicRecorder onAudio={handleAudio} />
            {recognizing && <Text color="blue.500">Transcribing...</Text>}
            {error && <Text color="red.500">{error}</Text>}
            {debugInfo && (
              <Box p={3} bg="gray.100" borderRadius="md" fontSize="sm" maxW="sm">
                <Text fontWeight="bold">Debug Info:</Text>
                <Text>{debugInfo}</Text>
              </Box>
            )}
            {transcript && (
              <Box p={4} bg="white" borderRadius="md" boxShadow="md" maxW="sm">
                <Text fontSize="md">{transcript}</Text>
              </Box>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}

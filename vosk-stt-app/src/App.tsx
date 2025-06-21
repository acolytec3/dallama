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

  const handleAudio = async (audioBuffer: ArrayBuffer) => {
    if (!model) return;
    setRecognizing(true);
    setError(null);
    setTranscript("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognizer = new (model as any).KaldiRecognizer();
      const result = await recognizer.acceptWaveform(audioBuffer);
      if (result && result.text) {
        setTranscript(result.text);
      } else {
        setTranscript("No speech recognized.");
      }
      recognizer.free();
    } catch {
      setError("Recognition failed. Try again.");
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

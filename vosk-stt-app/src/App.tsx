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

  const handleAudio = async (audioBuffer: AudioBuffer) => {
    if (!model) return;
    setRecognizing(true);
    setError(null);
    setTranscript("");
    
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
        }
        recognizer.remove();
      });
      
      recognizer.on("partialresult", (message: { result: { partial: string } }) => {
        console.log("Partial result:", message);
        if (message.result && message.result.partial) {
          setTranscript(message.result.partial);
        }
      });
      
    } catch (err) {
      console.error("Recognition error:", err);
      setError(`Recognition failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRecognizing(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bg="gray.50" 
      p={{ base: 4, md: 6 }}
      maxW="100vw"
      overflowX="hidden"
    >
      <Stack 
        gap={{ base: 6, md: 8 }} 
        alignItems="center" 
        direction="column"
        maxW="100%"
        px={{ base: 2, md: 4 }}
      >
        <Heading 
          as="h1" 
          size={{ base: "lg", md: "xl" }} 
          mt={{ base: 6, md: 8 }}
          textAlign="center"
          color="gray.800"
          fontWeight="bold"
        >
          Vosk STT Mobile Web App
        </Heading>
        
        {!modelLoaded && <ModelLoader onReady={(m) => { setModel(m); setModelLoaded(true); }} />}
        
        {modelLoaded && (
          <>
            <MicRecorder onAudio={handleAudio} />
            
            {recognizing && (
              <Text 
                color="blue.600" 
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="medium"
                textAlign="center"
              >
                Transcribing...
              </Text>
            )}
            
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
                maxW="100%"
              >
                {error}
              </Text>
            )}
            
            {transcript && (
              <Box 
                p={{ base: 4, md: 6 }} 
                bg="white" 
                borderRadius="lg" 
                boxShadow="lg" 
                maxW={{ base: "100%", md: "lg" }}
                w="100%"
                border="1px solid"
                borderColor="gray.200"
              >
                <Text 
                  fontSize={{ base: "md", md: "lg" }}
                  color="gray.800"
                  lineHeight="1.6"
                  textAlign="left"
                >
                  {transcript}
                </Text>
              </Box>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}

import { Box, Heading, Stack, Text, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import ModelLoader from "./components/ModelLoader";
import MicRecorder from "./components/MicRecorder";
import ConversationDisplay from "./components/ConversationDisplay";
import { useConversation } from "./hooks/useConversation";

export default function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [model, setModel] = useState<unknown>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = false;

  const {
    messages,
    isLoading: llmLoading,
    error: llmError,
    isConnected,
    sendMessage,
    updateCurrentMessage,
    clearConversation,
    clearError: clearLlmError,
    testConnection,
  } = useConversation();

  // Test LLM connection on component mount
  useEffect(() => {
    console.log("App mounted, testing LLM connection...");
    testConnection();
  }, [testConnection]);

  const handleAudio = async (audioBuffer: AudioBuffer) => {
    if (!model) return;
    setRecognizing(true);
    setError(null);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognizer = new (model as any).KaldiRecognizer(16000);
      console.log("Recognizer created successfully");
      
      console.log("Audio buffer info:", {
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        length: audioBuffer.length,
        duration: audioBuffer.duration
      });
      
      // Track last transcript to send only once when stable
      let lastTranscript = '';
      let sendTimeout: ReturnType<typeof setTimeout> | null = null;
      
      // Set up event listeners BEFORE sending audio
      recognizer.on("partialresult", (message: { result: { partial: string } }) => {
        console.log("Partial result event:", message);
        if (message.result && message.result.partial) {
          const partialTranscript = message.result.partial.trim();
          console.log("Partial transcript:", partialTranscript);
          
          if (partialTranscript) {
            lastTranscript = partialTranscript;
            updateCurrentMessage(partialTranscript);
            
            // Debounce: wait 300ms after last partial before sending to LLM
            if (sendTimeout) clearTimeout(sendTimeout);
            sendTimeout = setTimeout(() => {
              if (lastTranscript && isConnected) {
                console.log("Sending to LLM:", lastTranscript);
                sendMessage(lastTranscript);
                setRecognizing(false);
              }
            }, 300);
          }
        }
      });
      
      recognizer.on("result", (message: { result: { text: string } }) => {
        console.log("Result event:", message);
        
        // Cancel debounce timeout if we get a final result
        if (sendTimeout) clearTimeout(sendTimeout);
        
        if (message.result && message.result.text) {
          const finalTranscript = message.result.text.trim();
          console.log("Final transcript:", finalTranscript);
          
          if (finalTranscript) {
            updateCurrentMessage(finalTranscript);
            
            if (isConnected) {
              console.log("Sending to LLM:", finalTranscript);
              sendMessage(finalTranscript);
            }
          }
        }
        setRecognizing(false);
      });
      
      // Now send the audio
      recognizer.acceptWaveform(audioBuffer);
      console.log("Audio sent to recognizer");
      
    } catch (err) {
      console.error("Recognition error:", err);
      setError(`Recognition failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setRecognizing(false);
    }
  };

  const bgColor = isDark ? "gray.900" : "gray.50";
  const textColor = isDark ? "gray.100" : "gray.800";

  return (
    <Box 
      minH="100vh" 
      bg={bgColor} 
      p={{ base: 2, md: 4 }}
      maxW="100vw"
      overflowX="hidden"
    >
      <Stack 
        gap={{ base: 3, md: 4 }} 
        alignItems="center" 
        direction="column"
        maxW="100%"
        px={{ base: 1, md: 2 }}
      >
        <Heading 
          as="h1" 
          size={{ base: "md", md: "lg" }} 
          mt={{ base: 2, md: 4 }}
          color={textColor}
          fontWeight="bold"
          textAlign="center"
        >
          Voice AI Chat
        </Heading>
        
        {!modelLoaded && <ModelLoader onReady={(m) => { setModel(m); setModelLoaded(true); }} />}
        
        {modelLoaded && (
          <>
            <MicRecorder onAudio={handleAudio} />
            
            {recognizing && (
              <Text 
                color={isDark ? "blue.300" : "blue.600"} 
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="medium"
                textAlign="center"
              >
                Transcribing...
              </Text>
            )}
            
            {error && (
              <Text 
                color={isDark ? "red.300" : "red.600"} 
                fontSize={{ base: "xs", md: "sm" }}
                textAlign="center"
                bg={isDark ? "red.900" : "red.50"}
                p={2}
                borderRadius="md"
                border="1px solid"
                borderColor={isDark ? "red.600" : "red.200"}
                maxW="100%"
              >
                {error}
              </Text>
            )}

            {!isConnected && (
              <Text 
                color={isDark ? "yellow.300" : "yellow.600"} 
                fontSize={{ base: "xs", md: "sm" }}
                textAlign="center"
                bg={isDark ? "yellow.900" : "yellow.50"}
                p={2}
                borderRadius="md"
                border="1px solid"
                borderColor={isDark ? "yellow.600" : "yellow.200"}
                maxW="100%"
              >
                ⚠️ AI not connected
              </Text>
            )}
            
            <ConversationDisplay 
              messages={messages}
              isLoading={llmLoading}
              error={llmError}
              onClearError={clearLlmError}
            />

            {messages.length > 0 && (
              <Button
                onClick={clearConversation}
                variant="outline"
                size={{ base: "sm", md: "md" }}
                colorScheme="gray"
                maxW={{ base: "180px", md: "200px" }}
                w="100%"
              >
                Clear
              </Button>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}

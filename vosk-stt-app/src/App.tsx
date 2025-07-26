import { Box, Heading, Stack, Text, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import ModelLoader from "./components/ModelLoader";
import MicRecorder from "./components/MicRecorder";
import ConversationDisplay from "./components/ConversationDisplay";
import LLMModeToggle from "./components/LLMModeToggle";
import { useConversation } from "./hooks/useConversation";

export default function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [model, setModel] = useState<unknown>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Temporarily use light mode until import issue is resolved
  const isDark = false;

  const {
    messages,
    isLoading: llmLoading,
    error: llmError,
    isConnected,
    llmMode,
    localLLMStatus,
    sendMessage,
    updateCurrentMessage,
    clearConversation,
    clearError: clearLlmError,
    testConnection,
    setLLMMode,
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
      
      recognizer.acceptWaveform(audioBuffer);
      console.log("Audio sent to recognizer");
      
      // Set up event listeners for results      
      recognizer.on("partialresult", (message: { result: { partial: string } }) => {
        console.log("Partial result:", message);
        if (message.result && message.result.partial) {
          const partialTranscript = message.result.partial;
          console.log("Partial transcript:", partialTranscript);
          
          // Update the conversation with partial results
          if (partialTranscript.trim()) {
            updateCurrentMessage(partialTranscript);
            
            // Send to LLM immediately since Vosk doesn't add punctuation
            // and we're manually controlling recording start/stop
            if (isConnected && partialTranscript.trim()) {
              console.log("Sending partial result to LLM:", partialTranscript);
              sendMessage(partialTranscript);
            }
          }
        }
      });
      
    } catch (err) {
      console.error("Recognition error:", err);
      setError(`Recognition failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRecognizing(false);
    }
  };

  const bgColor = isDark ? "gray.900" : "gray.50";
  const textColor = isDark ? "gray.100" : "gray.800";

  return (
    <Box 
      minH="100vh" 
      bg={bgColor} 
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
          color={textColor}
          fontWeight="bold"
          textAlign="center"
        >
          Voice AI Chat
        </Heading>
        
        {!modelLoaded && <ModelLoader onReady={(m) => { setModel(m); setModelLoaded(true); }} />}
        
        {modelLoaded && (
          <>
            <LLMModeToggle
              mode={llmMode}
              onModeChange={setLLMMode}
              isConnected={isConnected}
              localLLMStatus={localLLMStatus}
            />
            
            <MicRecorder onAudio={handleAudio} />
            
            {recognizing && (
              <Text 
                color={isDark ? "blue.300" : "blue.600"} 
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="medium"
                textAlign="center"
              >
                Transcribing...
              </Text>
            )}
            
            {error && (
              <Text 
                color={isDark ? "red.300" : "red.600"} 
                fontSize={{ base: "sm", md: "md" }}
                textAlign="center"
                bg={isDark ? "red.900" : "red.50"}
                p={3}
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
                fontSize={{ base: "sm", md: "md" }}
                textAlign="center"
                bg={isDark ? "yellow.900" : "yellow.50"}
                p={3}
                borderRadius="md"
                border="1px solid"
                borderColor={isDark ? "yellow.600" : "yellow.200"}
                maxW="100%"
              >
                ⚠️ AI not connected. Speech will be transcribed but not sent to AI.
              </Text>
            )}

            {/* Debug test button */}
            <Button
              onClick={() => {
                console.log("Manual test button clicked");
                console.log("isConnected:", isConnected);
                console.log("messages:", messages);
                sendMessage("This is a test message from the debug button");
              }}
              variant="outline"
              size={{ base: "sm", md: "md" }}
              colorScheme="green"
              maxW={{ base: "200px", md: "250px" }}
              w="100%"
            >
              Test LLM Connection
            </Button>
            
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
                size={{ base: "md", md: "lg" }}
                colorScheme="gray"
                maxW={{ base: "200px", md: "250px" }}
                w="100%"
              >
                Clear Conversation
              </Button>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}

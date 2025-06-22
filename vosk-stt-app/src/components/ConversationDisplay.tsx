import { Box, Text, VStack, HStack, Spinner, IconButton } from "@chakra-ui/react";
 import { useColorMode } from "./ui/color-mode"; // Temporarily disabled due to import issues
import { ConversationMessage } from "../hooks/useConversation";

interface ConversationDisplayProps {
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function ConversationDisplay({ 
  messages, 
  isLoading, 
  error, 
  onClearError 
}: ConversationDisplayProps) {
  // Temporarily use light mode until import issue is resolved
  const isDark = useColorMode().colorMode === "dark";
  
  const bgColor = isDark ? "gray.800" : "white";
  const borderColor = isDark ? "gray.600" : "gray.200";
  const userBgColor = isDark ? "blue.900" : "blue.50";
  const aiBgColor = isDark ? "gray.700" : "gray.50";
  const userTextColor = isDark ? "blue.100" : "blue.800";
  const aiTextColor = isDark ? "gray.100" : "gray.800";
  const placeholderColor = isDark ? "gray.400" : "gray.500";
  const errorBgColor = isDark ? "red.900" : "red.50";
  const errorBorderColor = isDark ? "red.600" : "red.200";
  const errorTextColor = isDark ? "red.200" : "red.700";
  const errorIconColor = isDark ? "red.300" : "red.500";
  const spinnerColor = isDark ? "blue.300" : "blue.500";

  if (messages.length === 0 && !isLoading && !error) {
    return (
      <Box 
        p={6} 
        bg={bgColor} 
        borderRadius="lg" 
        boxShadow="lg" 
        border="1px solid"
        borderColor={borderColor}
        textAlign="center"
        maxW={{ base: "100%", md: "lg" }}
        w="100%"
      >
        <Text 
          color={placeholderColor}
          fontSize={{ base: "md", md: "lg" }}
        >
          Start speaking to begin a conversation with AI
        </Text>
      </Box>
    );
  }

  return (
    <VStack 
      gap={4} 
      maxW={{ base: "100%", md: "lg" }}
      w="100%"
      alignItems="stretch"
    >
      {messages.map((message) => (
        <Box
          key={message.id}
          p={4}
          bg={message.type === 'user' ? userBgColor : aiBgColor}
          borderRadius="lg"
          border="1px solid"
          borderColor={borderColor}
          alignSelf={message.type === 'user' ? 'flex-end' : 'flex-start'}
          maxW="80%"
          w="fit-content"
        >
          <Text
            fontSize={{ base: "sm", md: "md" }}
            color={message.type === 'user' ? userTextColor : aiTextColor}
            lineHeight="1.5"
            whiteSpace="pre-wrap"
          >
            {message.text}
          </Text>
          <Text
            fontSize="xs"
            color={placeholderColor}
            mt={2}
            textAlign="right"
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        </Box>
      ))}

      {isLoading && (
        <HStack 
          p={4} 
          bg={aiBgColor} 
          borderRadius="lg" 
          border="1px solid"
          borderColor={borderColor}
          alignSelf="flex-start"
          maxW="80%"
        >
          <Spinner size="sm" color={spinnerColor} />
          <Text 
            fontSize={{ base: "sm", md: "md" }}
            color={aiTextColor}
          >
            AI is thinking...
          </Text>
        </HStack>
      )}

      {error && (
        <Box
          p={4}
          bg={errorBgColor}
          borderRadius="lg"
          border="1px solid"
          borderColor={errorBorderColor}
          maxW="100%"
        >
          <HStack justify="space-between" align="start">
            <Text
              fontSize={{ base: "sm", md: "md" }}
              color={errorTextColor}
              flex={1}
            >
              {error}
            </Text>
            <IconButton
              aria-label="Clear error"
              size="sm"
              variant="ghost"
              onClick={onClearError}
              color={errorIconColor}
            >
              ×
            </IconButton>
          </HStack>
        </Box>
      )}
    </VStack>
  );
} 
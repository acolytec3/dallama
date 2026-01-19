import { Box, Text, VStack, HStack, Spinner, IconButton } from "@chakra-ui/react";
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
  const isDark = false;
  
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
        p={3} 
        bg={bgColor} 
        borderRadius="md" 
        boxShadow="sm" 
        border="1px solid"
        borderColor={borderColor}
        textAlign="center"
        maxW="100%"
        w="100%"
      >
        <Text 
          color={placeholderColor}
          fontSize={{ base: "xs", md: "sm" }}
        >
          Start speaking to begin
        </Text>
      </Box>
    );
  }

  return (
    <VStack 
      gap={2} 
      maxW="100%"
      w="100%"
      alignItems="stretch"
    >
      {messages.map((message) => (
        <Box
          key={message.id}
          p={2}
          bg={message.type === 'user' ? userBgColor : aiBgColor}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
          alignSelf={message.type === 'user' ? 'flex-end' : 'flex-start'}
          maxW="85%"
          w="fit-content"
        >
          <Text
            fontSize={{ base: "xs", md: "sm" }}
            color={message.type === 'user' ? userTextColor : aiTextColor}
            lineHeight="1.4"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            {message.text}
          </Text>
          <Text
            fontSize="2xs"
            color={placeholderColor}
            mt={1}
            textAlign="right"
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        </Box>
      ))}

      {isLoading && (
        <HStack 
          p={2} 
          bg={aiBgColor} 
          borderRadius="md" 
          border="1px solid"
          borderColor={borderColor}
          alignSelf="flex-start"
          maxW="85%"
        >
          <Spinner size="xs" color={spinnerColor} />
          <Text 
            fontSize={{ base: "xs", md: "sm" }}
            color={aiTextColor}
          >
            Thinking...
          </Text>
        </HStack>
      )}

      {error && (
        <Box
          p={2}
          bg={errorBgColor}
          borderRadius="md"
          border="1px solid"
          borderColor={errorBorderColor}
          maxW="100%"
        >
          <HStack justify="space-between" align="start">
            <Text
              fontSize={{ base: "xs", md: "sm" }}
              color={errorTextColor}
              flex={1}
            >
              {error}
            </Text>
            <IconButton
              aria-label="Clear error"
              size="xs"
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
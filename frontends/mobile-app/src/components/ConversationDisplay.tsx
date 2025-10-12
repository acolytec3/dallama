import React from 'react';
import { Box, Text, VStack, HStack, Spinner, Alert, Button, IconButton } from '@chakra-ui/react';
import { Message } from '../hooks/useConversation';
import { DynamicComponentRenderer } from './DynamicComponentRenderer';

interface ConversationDisplayProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export function ConversationDisplay({ messages, isLoading, error, onClearError }: ConversationDisplayProps) {
  if (messages.length === 0 && !isLoading && !error) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500" fontSize="lg">
          Start a conversation by typing a message or using voice input
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
      {messages.map((message) => (
        <Box
          key={message.id}
          alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'}
          maxW="80%"
        >
          <Box
            bg={message.sender === 'user' ? 'blue.500' : 'gray.100'}
            color={message.sender === 'user' ? 'white' : 'gray.800'}
            p={3}
            borderRadius="lg"
            borderTopLeftRadius={message.sender === 'assistant' ? 'sm' : 'lg'}
            borderTopRightRadius={message.sender === 'user' ? 'sm' : 'lg'}
          >
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {message.sender === 'user' ? 'You' : 'AI Assistant'}
            </Text>
            <Text fontSize="md" mb={2}>
              {message.text}
            </Text>
            
            {/* Render dynamic components if present */}
            {message.components && message.components.length > 0 && (
              <Box mt={3}>
                <DynamicComponentRenderer components={message.components} />
              </Box>
            )}
            
            <Text fontSize="xs" opacity={0.7}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </Text>
          </Box>
        </Box>
      ))}

      {isLoading && (
        <Box alignSelf="flex-start" maxW="80%">
          <Box bg="gray.100" p={3} borderRadius="lg" borderTopLeftRadius="sm">
            <HStack spacing={2}>
              <Spinner size="sm" color="blue.500" />
              <Text fontSize="sm" color="gray.600">
                AI is thinking...
              </Text>
            </HStack>
          </Box>
        </Box>
      )}

      {error && (
        <Alert status="error" borderRadius="md">
          <Text fontSize="sm">⚠</Text>
          <Box flex="1">
            <Text fontSize="sm">{error}</Text>
          </Box>
          <IconButton
            aria-label="Clear error"
            icon={<Text>×</Text>}
            size="sm"
            variant="ghost"
            onClick={onClearError}
          />
        </Alert>
      )}
    </VStack>
  );
}


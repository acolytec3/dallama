import React, { useState } from 'react';
import { Box, Input, Button, HStack, VStack, Text } from '@chakra-ui/react';
import { FaPaperPlane } from 'react-icons/fa';

interface TextInterfaceProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isConnected: boolean;
}

export function TextInterface({ onSendMessage, isLoading, isConnected }: TextInterfaceProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="lg" fontWeight="medium">
        Text Input
      </Text>
      
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={3}>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            size="lg"
            isDisabled={!isConnected || isLoading}
            bg="white"
            border="2px solid"
            borderColor="gray.200"
            _focus={{
              borderColor: 'blue.500',
              boxShadow: '0 0 0 1px #3182ce'
            }}
          />
          
          <HStack spacing={2} w="full">
            <Button
              type="submit"
              colorScheme="blue"
              leftIcon={<FaPaperPlane />}
              isLoading={isLoading}
              loadingText="Sending..."
              isDisabled={!message.trim() || !isConnected}
              size="lg"
              flex="1"
            >
              Send Message
            </Button>
          </HStack>
          
          {!isConnected && (
            <Text color="red.500" fontSize="sm" textAlign="center">
              ⚠️ Not connected to AI server
            </Text>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}


import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Container, 
  Heading, 
  Divider,
  useColorMode,
  IconButton,
  Badge,
  Spinner
} from '@chakra-ui/react';
import { FaSun, FaMoon, FaTrash, FaWifi, FaWifiSlash } from 'react-icons/fa';
import { useConversation } from './hooks/useConversation';
import { ConversationDisplay } from './components/ConversationDisplay';
import { VoiceInterface } from './components/VoiceInterface';
import { TextInterface } from './components/TextInterface';

export function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('text');
  
  const {
    messages,
    isLoading,
    error,
    isConnected,
    sendMessage,
    updateCurrentMessage,
    clearConversation,
    clearError,
    testConnection,
  } = useConversation();

  // Test connection on component mount
  useEffect(() => {
    console.log("App mounted, testing connection...");
    testConnection();
  }, [testConnection]);

  const handleVoiceTranscription = (text: string) => {
    updateCurrentMessage(text);
    sendMessage(text);
  };

  const handleTextMessage = (text: string) => {
    sendMessage(text);
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color="brand.500">
                AI Assistant
              </Heading>
              <HStack spacing={2}>
                <Badge 
                  colorScheme={isConnected ? 'green' : 'red'} 
                  variant="solid"
                  fontSize="xs"
                >
                  {isConnected ? (
                    <>
                      <FaWifi style={{ marginRight: '4px' }} />
                      Connected
                    </>
                  ) : (
                    <>
                      <FaWifiSlash style={{ marginRight: '4px' }} />
                      Disconnected
                    </>
                  )}
                </Badge>
                {isLoading && <Spinner size="sm" color="blue.500" />}
              </HStack>
            </VStack>
            
            <HStack spacing={2}>
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                onClick={toggleColorMode}
                variant="ghost"
                size="sm"
              />
              {messages.length > 0 && (
                <IconButton
                  aria-label="Clear conversation"
                  icon={<FaTrash />}
                  onClick={clearConversation}
                  variant="ghost"
                  size="sm"
                  colorScheme="red"
                />
              )}
            </HStack>
          </HStack>

          {/* Tab Navigation */}
          <HStack spacing={0} border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">
            <Button
              variant={activeTab === 'text' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'text' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('text')}
              borderRadius="none"
              flex="1"
              size="md"
            >
              Text Chat
            </Button>
            <Button
              variant={activeTab === 'voice' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'voice' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('voice')}
              borderRadius="none"
              flex="1"
              size="md"
            >
              Voice Input
            </Button>
          </HStack>

          {/* Main Content */}
          <VStack spacing={6} align="stretch">
            {/* Conversation Display */}
            <Box
              bg="white"
              _dark={{ bg: 'gray.800' }}
              p={6}
              borderRadius="lg"
              shadow="sm"
              border="1px solid"
              borderColor="gray.200"
              _dark={{ borderColor: 'gray.700' }}
              minH="400px"
            >
              <ConversationDisplay
                messages={messages}
                isLoading={isLoading}
                error={error}
                onClearError={clearError}
              />
            </Box>

            {/* Input Interface */}
            <Box
              bg="white"
              _dark={{ bg: 'gray.800' }}
              p={6}
              borderRadius="lg"
              shadow="sm"
              border="1px solid"
              borderColor="gray.200"
              _dark={{ borderColor: 'gray.700' }}
            >
              {activeTab === 'text' ? (
                <TextInterface
                  onSendMessage={handleTextMessage}
                  isLoading={isLoading}
                  isConnected={isConnected}
                />
              ) : (
                <VoiceInterface
                  onTranscription={handleVoiceTranscription}
                  isConnected={isConnected}
                />
              )}
            </Box>
          </VStack>

          {/* Footer */}
          <Box textAlign="center" py={4}>
            <Text fontSize="sm" color="gray.500">
              Multi-Frontend AI Assistant • Powered by Gemma 3N
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}


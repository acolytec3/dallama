import { Box, Text, HStack, VStack, Badge, Button } from "@chakra-ui/react";
import { LLMMode } from "../services/unifiedLLMService";

interface LLMModeToggleProps {
    mode: LLMMode;
    onModeChange: (mode: LLMMode) => void;
    isConnected: boolean;
    localLLMStatus: { isInitializing: boolean; isReady: boolean };
}

export default function LLMModeToggle({ 
    mode, 
    onModeChange, 
    isConnected, 
    localLLMStatus 
}: LLMModeToggleProps) {
    const handleToggle = () => {
        const newMode: LLMMode = mode === 'local' ? 'server' : 'local';
        onModeChange(newMode);
    };

    const getStatusColor = () => {
        if (!isConnected) return 'red';
        if (mode === 'local' && localLLMStatus.isInitializing) return 'yellow';
        return 'green';
    };

    const getStatusText = () => {
        if (!isConnected) return 'Disconnected';
        if (mode === 'local' && localLLMStatus.isInitializing) return 'Loading...';
        if (mode === 'local' && !localLLMStatus.isReady) return 'Initializing...';
        return 'Connected';
    };

    const getModeDescription = () => {
        if (mode === 'local') {
            return 'Local AI (SmolLM2-135M) - Runs in your browser';
        } else {
            return 'Server AI (Gemma-2-2b) - Runs on remote server';
        }
    };

    return (
        <Box
            p={4}
            bg="white"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            shadow="sm"
            maxW="400px"
            w="100%"
        >
            <VStack gap={3} align="stretch">
                <HStack justify="space-between" align="center">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        AI Mode
                    </Text>
                    <Badge 
                        colorScheme={getStatusColor()} 
                        variant="subtle"
                        fontSize="xs"
                    >
                        {getStatusText()}
                    </Badge>
                </HStack>

                <HStack justify="space-between" align="center">
                    <VStack align="start" gap={1}>
                        <Text fontSize="xs" color="gray.600" fontWeight="medium">
                            {mode === 'local' ? 'Local' : 'Server'}
                        </Text>
                        <Text fontSize="xs" color="gray.500" lineHeight="1.2">
                            {getModeDescription()}
                        </Text>
                    </VStack>
                    
                    <Button
                        onClick={handleToggle}
                        colorScheme="blue"
                        size="sm"
                        variant="outline"
                    >
                        {mode === 'local' ? 'Local' : 'Server'}
                    </Button>
                </HStack>

                {mode === 'local' && localLLMStatus.isInitializing && (
                    <Text fontSize="xs" color="blue.600" textAlign="center">
                        ⏳ Downloading AI model... This may take a few minutes on first use.
                    </Text>
                )}
            </VStack>
        </Box>
    );
} 
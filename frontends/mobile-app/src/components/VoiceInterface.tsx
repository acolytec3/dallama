import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Text, VStack, HStack, IconButton, useToast } from '@chakra-ui/react';
import { FaMicrophone, FaMicrophoneSlash, FaStop } from 'react-icons/fa';

interface VoiceInterfaceProps {
  onTranscription: (text: string) => void;
  isConnected: boolean;
}

export function VoiceInterface({ onTranscription, isConnected }: VoiceInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const toast = useToast();

  useEffect(() => {
    // Request microphone permission on component mount
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        console.log('Microphone permission granted');
      })
      .catch((error) => {
        console.error('Microphone permission denied:', error);
        toast({
          title: 'Microphone Access Required',
          description: 'Please allow microphone access to use voice input.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      });
  }, [toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('');
      
      toast({
        title: 'Recording Started',
        description: 'Speak now...',
        status: 'info',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Failed',
        description: 'Could not start recording. Please check microphone permissions.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks to release microphone
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // For now, we'll simulate transcription
      // In a full implementation, this would send audio to STT service
      setTimeout(() => {
        const mockTranscript = "This is a mock transcription of your voice input.";
        setTranscript(mockTranscript);
        onTranscription(mockTranscript);
        setIsProcessing(false);
        
        toast({
          title: 'Transcription Complete',
          description: 'Voice input processed successfully.',
          status: 'success',
          duration: 3000,
        });
      }, 2000);
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      toast({
        title: 'Transcription Failed',
        description: 'Could not process voice input. Please try again.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box textAlign="center">
        <Text fontSize="lg" fontWeight="medium" mb={4}>
          Voice Input
        </Text>
        
        <VStack spacing={4}>
          <Button
            size="lg"
            colorScheme={isRecording ? 'red' : 'blue'}
            leftIcon={isRecording ? <FaStop /> : <FaMicrophone />}
            onClick={handleVoiceToggle}
            isLoading={isProcessing}
            loadingText="Processing..."
            isDisabled={!isConnected}
            minH="60px"
            minW="200px"
            fontSize="lg"
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>

          {!isConnected && (
            <Text color="red.500" fontSize="sm" textAlign="center">
              ⚠️ Not connected to AI server
            </Text>
          )}

          {transcript && (
            <Box
              bg="gray.50"
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
              w="full"
            >
              <Text fontSize="sm" color="gray.600" mb={2}>
                Transcribed:
              </Text>
              <Text fontSize="md">
                {transcript}
              </Text>
            </Box>
          )}

          {isRecording && (
            <HStack spacing={2}>
              <Box w="8px" h="8px" bg="red.500" borderRadius="full" animation="pulse" />
              <Text fontSize="sm" color="red.500">
                Recording...
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}


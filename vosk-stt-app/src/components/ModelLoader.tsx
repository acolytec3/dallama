import { useEffect, useState } from "react";
import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { createModel } from "vosk-browser";

interface ModelLoaderProps {
  onReady: (model: unknown) => void;
}

const MODEL_URL = "/model/vosk-model-small-en-us-0.15.tar.gz";

const ModelLoader = ({ onReady }: ModelLoaderProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    createModel(MODEL_URL)
      .then((model) => {
        if (isMounted) {
          setLoading(false);
          onReady(model);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoading(false);
          setError(`Failed to load model: ${err.message}`);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onReady]);

  if (loading) {
    return (
      <VStack 
        gap={{ base: 4, md: 6 }} 
        p={{ base: 6, md: 8 }}
        w="100%"
        maxW="100%"
        textAlign="center"
      >
        <Spinner 
          size={{ base: "xl", md: "xl" }} 
          color="blue.600" 
        />
        <Text 
          fontSize={{ base: "lg", md: "xl" }}
          color="gray.800"
          fontWeight="medium"
        >
          Loading Vosk model...
        </Text>
        <Text 
          fontSize={{ base: "sm", md: "md" }} 
          color="gray.600"
          maxW="100%"
        >
          This may take a few moments on first load.
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <Box 
        textAlign="center" 
        p={{ base: 6, md: 8 }}
        w="100%"
        maxW="100%"
      >
        <Text 
          color="red.600" 
          mb={3}
          fontSize={{ base: "md", md: "lg" }}
          fontWeight="medium"
          bg="red.50"
          p={3}
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
        >
          {error}
        </Text>
        <Text 
          fontSize={{ base: "sm", md: "md" }} 
          color="gray.600"
          maxW="100%"
        >
          Please check your internet connection and try again.
        </Text>
      </Box>
    );
  }

  return null;
};

export default ModelLoader; 
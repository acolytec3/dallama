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
        gap={{ base: 2, md: 3 }} 
        p={{ base: 3, md: 4 }}
        w="100%"
        maxW="100%"
        textAlign="center"
      >
        <Spinner 
          size={{ base: "md", md: "lg" }} 
          color="blue.600" 
        />
        <Text 
          fontSize={{ base: "sm", md: "md" }}
          color="gray.800"
          fontWeight="medium"
        >
          Loading model...
        </Text>
        <Text 
          fontSize={{ base: "xs", md: "sm" }} 
          color="gray.600"
          maxW="100%"
        >
          Please wait...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <Box 
        textAlign="center" 
        p={{ base: 3, md: 4 }}
        w="100%"
        maxW="100%"
      >
        <Text 
          color="red.600" 
          mb={2}
          fontSize={{ base: "xs", md: "sm" }}
          fontWeight="medium"
          bg="red.50"
          p={2}
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
        >
          {error}
        </Text>
        <Text 
          fontSize={{ base: "xs", md: "sm" }} 
          color="gray.600"
          maxW="100%"
        >
          Check connection and try again.
        </Text>
      </Box>
    );
  }

  return null;
};

export default ModelLoader; 
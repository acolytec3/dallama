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
      <VStack gap={4} p={4}>
        <Spinner size="lg" color="blue.500" />
        <Text>Loading Vosk model...</Text>
        <Text fontSize="sm" color="gray.500">
          This may take a few moments on first load.
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={4}>
        <Text color="red.500" mb={2}>
          {error}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Please check your internet connection and try again.
        </Text>
      </Box>
    );
  }

  return null;
};

export default ModelLoader; 
import React from 'react';
import { Box, Text, Button, ButtonGroup, VStack, HStack, Badge, Progress } from '@chakra-ui/react';
import { DynamicComponent } from '../services/api';

// Component registry for dynamic rendering
const componentRegistry: Record<string, React.ComponentType<any>> = {
  'weather-card': WeatherCard,
  'timer-display': TimerDisplay,
  'calculator': Calculator,
  'image-gallery': ImageGallery,
  'chart': Chart,
  'button-group': ButtonGroup,
  'status-indicator': StatusIndicator,
  'form': DynamicForm,
  'list': DynamicList,
  'modal': Modal,
};

interface DynamicComponentRendererProps {
  components: DynamicComponent[];
}

export function DynamicComponentRenderer({ components }: DynamicComponentRendererProps) {
  const renderComponent = (component: DynamicComponent, index: number) => {
    const Component = componentRegistry[component.type];
    
    if (!Component) {
      console.warn(`Unknown component type: ${component.type}`);
      return (
        <Box key={index} p={4} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
          <Text color="red.600">Unknown component: {component.type}</Text>
        </Box>
      );
    }
    
    return <Component key={index} {...component.props} />;
  };

  return (
    <VStack spacing={4} align="stretch">
      {components.map((component, index) => (
        <Box key={index} className="component-wrapper">
          {renderComponent(component, index)}
        </Box>
      ))}
    </VStack>
  );
}

// Example components
function WeatherCard({ location, temperature, condition, humidity, windSpeed }: any) {
  return (
    <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" color="white" p={6} borderRadius="lg" textAlign="center">
      <Text fontSize="xl" fontWeight="bold" mb={2}>{location}</Text>
      <Text fontSize="4xl" fontWeight="bold" mb={2}>{temperature}°F</Text>
      <Text fontSize="lg" mb={4}>{condition}</Text>
      <HStack justify="center" spacing={4}>
        <Text fontSize="sm">Humidity: {humidity}%</Text>
        <Text fontSize="sm">Wind: {windSpeed} mph</Text>
      </HStack>
    </Box>
  );
}

function TimerDisplay({ duration, label, onComplete }: any) {
  const [timeLeft, setTimeLeft] = React.useState(duration);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Box bg="gray.50" border="2px solid" borderColor="gray.200" borderRadius="lg" p={4} textAlign="center">
      <Text fontSize="lg" fontWeight="medium" mb={2}>{label}</Text>
      <Text fontSize="3xl" fontWeight="bold" color="blue.600">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </Text>
    </Box>
  );
}

function Calculator({ initialValue = 0, onCalculate }: any) {
  const [display, setDisplay] = React.useState(initialValue.toString());
  const [operation, setOperation] = React.useState<string | null>(null);
  const [firstNumber, setFirstNumber] = React.useState<number | null>(null);

  const handleNumber = (num: string) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const handleOperation = (op: string) => {
    setFirstNumber(parseFloat(display));
    setOperation(op);
    setDisplay('0');
  };

  const calculate = () => {
    if (!firstNumber || !operation) return;
    
    const secondNumber = parseFloat(display);
    let result = 0;
    
    switch (operation) {
      case '+': result = firstNumber + secondNumber; break;
      case '-': result = firstNumber - secondNumber; break;
      case '*': result = firstNumber * secondNumber; break;
      case '/': result = firstNumber / secondNumber; break;
    }
    
    setDisplay(result.toString());
    onCalculate?.(result);
    setOperation(null);
    setFirstNumber(null);
  };

  const buttons = [
    [7, 8, 9, '/'],
    [4, 5, 6, '*'],
    [1, 2, 3, '-'],
    [0, '.', '=', '+']
  ];

  return (
    <Box bg="gray.800" borderRadius="lg" p={4} color="white">
      <Box bg="gray.700" color="white" p={4} textAlign="right" fontSize="xl" mb={4} borderRadius="md">
        {display}
      </Box>
      <VStack spacing={2}>
        {buttons.map((row, rowIndex) => (
          <HStack key={rowIndex} spacing={2}>
            {row.map(btn => (
              <Button
                key={btn}
                onClick={() => typeof btn === 'number' ? handleNumber(btn.toString()) : 
                         btn === '=' ? calculate() : handleOperation(btn)}
                bg="blue.600"
                color="white"
                size="lg"
                minW="60px"
                h="50px"
                _hover={{ bg: 'blue.700' }}
              >
                {btn}
              </Button>
            ))}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

function ImageGallery({ images, title }: any) {
  return (
    <Box>
      {title && <Text fontSize="lg" fontWeight="bold" mb={3}>{title}</Text>}
      <HStack spacing={2} overflowX="auto">
        {images?.map((image: any, index: number) => (
          <Box key={index} minW="120px" h="120px" bg="gray.200" borderRadius="md" />
        ))}
      </HStack>
    </Box>
  );
}

function Chart({ data, title, type = 'bar' }: any) {
  return (
    <Box>
      {title && <Text fontSize="lg" fontWeight="bold" mb={3}>{title}</Text>}
      <Box h="200px" bg="gray.100" borderRadius="md" p={4}>
        <Text color="gray.600" textAlign="center" mt="50px">
          Chart: {type} - {data?.length || 0} data points
        </Text>
      </Box>
    </Box>
  );
}

function StatusIndicator({ status, message }: any) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <HStack spacing={3}>
      <Badge colorScheme={getStatusColor(status)} variant="solid">
        {status}
      </Badge>
      <Text>{message}</Text>
    </HStack>
  );
}

function DynamicForm({ fields, onSubmit }: any) {
  const [values, setValues] = React.useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={3}>
        {fields?.map((field: any, index: number) => (
          <Box key={index} w="full">
            <Text mb={1} fontSize="sm" fontWeight="medium">{field.label}</Text>
            <Box
              as="input"
              w="full"
              p={3}
              border="1px solid"
              borderColor="gray.300"
              borderRadius="md"
              placeholder={field.placeholder}
              value={values[field.name] || ''}
              onChange={(e: any) => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
            />
          </Box>
        ))}
        <Button type="submit" colorScheme="blue" w="full">
          Submit
        </Button>
      </VStack>
    </Box>
  );
}

function DynamicList({ items, title }: any) {
  return (
    <Box>
      {title && <Text fontSize="lg" fontWeight="bold" mb={3}>{title}</Text>}
      <VStack spacing={2} align="stretch">
        {items?.map((item: any, index: number) => (
          <Box key={index} p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
            <Text>{item}</Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

function Modal({ title, content, onClose }: any) {
  return (
    <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="blackAlpha.600" zIndex={1000}>
      <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" bg="white" p={6} borderRadius="lg" maxW="400px" w="90%">
        <HStack justify="space-between" mb={4}>
          <Text fontSize="lg" fontWeight="bold">{title}</Text>
          <Button size="sm" onClick={onClose}>×</Button>
        </HStack>
        <Text>{content}</Text>
      </Box>
    </Box>
  );
}


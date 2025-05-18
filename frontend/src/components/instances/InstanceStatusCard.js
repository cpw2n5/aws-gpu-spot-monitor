import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Badge,
  Link,
  Button,
  useColorModeValue,
  Tooltip,
  HStack,
  VStack,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FiCpu, FiDollarSign, FiMapPin, FiClock, FiActivity } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import FoldingService from '../../services/folding.service';

/**
 * Instance status card component
 * @param {Object} props - Component props
 * @param {Object} props.instance - Instance data
 */
const InstanceStatusCard = ({ instance }) => {
  // Fetch folding status for this instance
  const { data: foldingStatus, isLoading: isFoldingLoading } = useQuery({
    queryKey: ['foldingStatus', instance.id],
    queryFn: () => FoldingService.getInstanceStatus(instance.id),
    enabled: !!instance.id && instance.state === 'running',
  });

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'stopping':
      case 'stopped':
        return 'orange';
      case 'terminated':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate runtime
  const calculateRuntime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box
      bg={useColorModeValue('white', 'gray.700')}
      shadow="md"
      rounded="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      _hover={{
        transform: 'translateY(-2px)',
        shadow: 'lg',
        borderColor: useColorModeValue('blue.300', 'blue.400'),
      }}
      transition="all 0.3s"
    >
      <Box p={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="bold" fontSize="lg" isTruncated>
            {instance.instanceId || 'Instance'}
          </Text>
          <Badge colorScheme={getStatusColor(instance.state)}>
            {instance.state}
          </Badge>
        </Flex>
        
        <VStack align="stretch" spacing={2} mt={3}>
          <HStack>
            <Icon as={FiCpu} color="gray.500" />
            <Text fontSize="sm">{instance.instanceType}</Text>
          </HStack>
          
          <HStack>
            <Icon as={FiMapPin} color="gray.500" />
            <Text fontSize="sm">{instance.region}</Text>
          </HStack>
          
          <HStack>
            <Icon as={FiDollarSign} color="gray.500" />
            <Text fontSize="sm">${instance.spotPrice}/hr</Text>
          </HStack>
          
          <HStack>
            <Icon as={FiClock} color="gray.500" />
            <Text fontSize="sm">
              {instance.launchTime ? calculateRuntime(instance.launchTime) : 'N/A'}
            </Text>
          </HStack>
        </VStack>
        
        {instance.state === 'running' && foldingStatus && (
          <>
            <Divider my={3} />
            <Box>
              <Flex align="center" mb={2}>
                <Icon as={FiActivity} color="green.500" mr={2} />
                <Text fontWeight="medium">Folding Status</Text>
              </Flex>
              
              <HStack spacing={4} mt={2}>
                <Tooltip label="Points earned on this instance">
                  <Badge colorScheme="purple" px={2} py={1}>
                    {foldingStatus.points || 0} pts
                  </Badge>
                </Tooltip>
                
                <Tooltip label="Work units completed">
                  <Badge colorScheme="blue" px={2} py={1}>
                    {foldingStatus.workUnits || 0} WUs
                  </Badge>
                </Tooltip>
              </HStack>
            </Box>
          </>
        )}
        
        <Flex mt={4} justify="flex-end">
          <Button
            as={RouterLink}
            to={`/instances/${instance.id}`}
            size="sm"
            colorScheme="blue"
            variant="outline"
          >
            Details
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default InstanceStatusCard;
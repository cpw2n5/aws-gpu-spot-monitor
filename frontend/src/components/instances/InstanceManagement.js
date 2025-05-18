import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Button,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Badge,
  HStack,
  IconButton,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import InstanceService from '../../services/instance.service';
import InstanceStatusCard from './InstanceStatusCard';
import InstanceForm from './InstanceForm';

/**
 * InstanceManagement component
 */
const InstanceManagement = () => {
  const [filter, setFilter] = useState('all'); // all, running, stopped, terminated
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Fetch instances
  const { data: instances, isLoading, isError, refetch } = useQuery({
    queryKey: ['instances'],
    queryFn: InstanceService.listInstances,
  });
  
  // Mutation for terminating an instance
  const terminateMutation = useMutation({
    mutationFn: InstanceService.terminateInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      toast({
        title: 'Instance terminated',
        description: 'The instance has been terminated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to terminate instance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
  
  // Mutation for requesting a new instance
  const requestInstanceMutation = useMutation({
    mutationFn: InstanceService.requestSpotInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      onClose();
      toast({
        title: 'Instance requested',
        description: 'Your spot instance request has been submitted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to request instance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
  
  // Filter instances
  const filteredInstances = instances?.filter(instance => {
    if (filter === 'all') return true;
    return instance.state === filter;
  }) || [];
  
  // Group instances by state
  const instancesByState = instances?.reduce((acc, instance) => {
    const state = instance.state || 'unknown';
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(instance);
    return acc;
  }, {}) || {};
  
  // Count instances by state
  const runningCount = instancesByState.running?.length || 0;
  const pendingCount = instancesByState.pending?.length || 0;
  const stoppedCount = instancesByState.stopped?.length || 0;
  const terminatedCount = instancesByState.terminated?.length || 0;
  
  // Handle instance request
  const handleRequestInstance = (instanceConfig) => {
    requestInstanceMutation.mutate(instanceConfig);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner 
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Flex>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Alert status="error" rounded="md">
        <AlertIcon />
        Error loading instance data. Please try again later.
      </Alert>
    );
  }

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          Instance Management
        </Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={onOpen}
        >
          Request New Instance
        </Button>
      </Flex>
      
      {/* Instance Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={5} mb={6}>
        <StatCard
          label="Running"
          value={runningCount}
          colorScheme="green"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          colorScheme="yellow"
        />
        <StatCard
          label="Stopped"
          value={stoppedCount}
          colorScheme="orange"
        />
        <StatCard
          label="Terminated"
          value={terminatedCount}
          colorScheme="red"
        />
      </SimpleGrid>
      
      {/* Instance Tabs */}
      <Box
        bg={useColorModeValue('white', 'gray.700')}
        shadow={'xl'}
        rounded={'lg'}
        p={6}
        mb={6}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="md">
            Your Instances
          </Heading>
          <Button
            leftIcon={<FiRefreshCw />}
            size="sm"
            onClick={() => refetch()}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </Flex>
        
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab onClick={() => setFilter('all')}>
              All
              <Badge ml={2} colorScheme="blue">
                {instances?.length || 0}
              </Badge>
            </Tab>
            <Tab onClick={() => setFilter('running')}>
              Running
              <Badge ml={2} colorScheme="green">
                {runningCount}
              </Badge>
            </Tab>
            <Tab onClick={() => setFilter('pending')}>
              Pending
              <Badge ml={2} colorScheme="yellow">
                {pendingCount}
              </Badge>
            </Tab>
            <Tab onClick={() => setFilter('stopped')}>
              Stopped
              <Badge ml={2} colorScheme="orange">
                {stoppedCount}
              </Badge>
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <InstanceGrid instances={filteredInstances} />
            </TabPanel>
            <TabPanel>
              <InstanceGrid instances={instancesByState.running || []} />
            </TabPanel>
            <TabPanel>
              <InstanceGrid instances={instancesByState.pending || []} />
            </TabPanel>
            <TabPanel>
              <InstanceGrid instances={instancesByState.stopped || []} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* New Instance Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request New Spot Instance</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <InstanceForm onSubmit={handleRequestInstance} isSubmitting={requestInstanceMutation.isLoading} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

/**
 * Instance grid component
 * @param {Object} props - Component props
 * @param {Array} props.instances - List of instances
 */
const InstanceGrid = ({ instances }) => {
  if (!instances || instances.length === 0) {
    return (
      <Box
        p={8}
        textAlign="center"
        border="1px dashed"
        borderColor={useColorModeValue('gray.200', 'gray.600')}
        borderRadius="md"
      >
        <Text color={useColorModeValue('gray.500', 'gray.400')}>
          No instances found.
        </Text>
      </Box>
    );
  }
  
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {instances.map(instance => (
        <InstanceStatusCard key={instance.id} instance={instance} />
      ))}
    </SimpleGrid>
  );
};

/**
 * Stat card component
 * @param {Object} props - Component props
 * @param {string} props.label - Card label
 * @param {number} props.value - Statistic value
 * @param {string} props.colorScheme - Color scheme
 */
const StatCard = ({ label, value, colorScheme }) => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.700')}
      shadow={'md'}
      rounded={'lg'}
      p={4}
      textAlign="center"
      borderTop="4px solid"
      borderColor={`${colorScheme}.400`}
    >
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
};

export default InstanceManagement;
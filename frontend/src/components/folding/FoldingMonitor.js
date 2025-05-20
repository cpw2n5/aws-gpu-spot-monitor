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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  HStack,
  VStack,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import { FiRefreshCw, FiSettings, FiCpu, FiAward, FiTrendingUp, FiServer } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import FoldingService from '../../services/folding.service';
import InstanceService from '../../services/instance.service';

/**
 * Helper function to get GPU model name from instance type
 * @param {string} instanceType - EC2 instance type
 * @returns {string} GPU model name
 */
const getGpuModel = (instanceType) => {
  // Extract instance family
  const instanceFamily = instanceType?.split('.')?.[0] || '';
  
  // Map instance families to GPU models
  const gpuModels = {
    'p2': 'NVIDIA K80',
    'p3': 'NVIDIA V100',
    'p4d': 'NVIDIA A100',
    'p4de': 'NVIDIA A100 80GB',
    'p5': 'NVIDIA H100',
    'g3': 'NVIDIA M60',
    'g3s': 'NVIDIA M60',
    'g4dn': 'NVIDIA T4',
    'g5': 'NVIDIA A10G',
    'g6': 'NVIDIA L4',
    'g6e': 'NVIDIA L40S',
    'gr6': 'NVIDIA RTX 6000 Ada'
  };
  
  return gpuModels[instanceFamily] || 'Unknown GPU';
};

/**
 * FoldingMonitor component
 */
const FoldingMonitor = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    user: '',
    team: '',
    passkey: '',
    power: 'full',
  });
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Fetch folding configuration
  const configQuery = useQuery({
    queryKey: ['foldingConfig'],
    queryFn: FoldingService.getConfiguration,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          user: data.user || '',
          team: data.team || '',
          passkey: data.passkey || '',
          power: data.power || 'full',
        });
      }
    },
  });
  
  // Fetch folding stats
  const statsQuery = useQuery({
    queryKey: ['foldingStats', formData.user, formData.team],
    queryFn: () => FoldingService.getStats(formData.user, formData.team),
    enabled: !!formData.user || !!formData.team,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  // Fetch instances
  const instancesQuery = useQuery({
    queryKey: ['instances'],
    queryFn: InstanceService.listInstances,
  });
  
  // Mutation for saving folding configuration
  const saveConfigMutation = useMutation({
    mutationFn: FoldingService.saveConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foldingConfig'] });
      onClose();
      toast({
        title: 'Configuration saved',
        description: 'Your Folding@Home configuration has been saved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save configuration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
  
  // Mutation for applying configuration to an instance
  const applyConfigMutation = useMutation({
    mutationFn: FoldingService.applyConfigurationToInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foldingStatus'] });
      toast({
        title: 'Configuration applied',
        description: 'The Folding@Home configuration has been applied to the instance.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to apply configuration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.user) {
      newErrors.user = 'Username is required';
    }
    
    if (!formData.team) {
      newErrors.team = 'Team ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    saveConfigMutation.mutate(formData);
  };
  
  // Handle apply configuration to instance
  const handleApplyConfig = (instanceId) => {
    applyConfigMutation.mutate(instanceId);
  };
  
  // Filter running instances
  const runningInstances = instancesQuery.data?.filter(instance => 
    instance.state === 'running'
  ) || [];
  
  // Format stats data for chart
  const formatStatsData = () => {
    if (!statsQuery.data?.history) return [];
    
    return statsQuery.data.history.map(entry => ({
      date: new Date(entry.date).toLocaleDateString(),
      points: entry.points,
      workUnits: entry.wus,
    }));
  };
  
  const statsData = formatStatsData();
  
  // Loading state
  if (configQuery.isLoading || instancesQuery.isLoading) {
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
  if (configQuery.isError || instancesQuery.isError) {
    return (
      <Alert status="error" rounded="md">
        <AlertIcon />
        Error loading Folding@Home data. Please try again later.
      </Alert>
    );
  }

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          Folding@Home Monitor
        </Heading>
        <Button
          leftIcon={<FiSettings />}
          colorScheme="blue"
          onClick={onOpen}
        >
          Configure
        </Button>
      </Flex>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={6}>
        <StatCard
          title="Total Points"
          value={statsQuery.data?.score?.toLocaleString() || '0'}
          icon={<Icon as={FiAward} w={8} h={8} />}
          helpText={statsQuery.data?.rank ? `Rank: ${statsQuery.data.rank.toLocaleString()}` : null}
        />
        <StatCard
          title="Work Units"
          value={statsQuery.data?.wus?.toLocaleString() || '0'}
          icon={<Icon as={FiCpu} w={8} h={8} />}
        />
        <StatCard
          title="Active Instances"
          value={runningInstances.length}
          icon={<Icon as={FiServer} w={8} h={8} />}
        />
        <StatCard
          title="24h Points"
          value={statsQuery.data?.last24h?.toLocaleString() || '0'}
          icon={<Icon as={FiTrendingUp} w={8} h={8} />}
          helpText={
            statsQuery.data?.last24h && statsQuery.data?.last24h_change ? (
              <StatArrow 
                type={statsQuery.data.last24h_change >= 0 ? 'increase' : 'decrease'} 
              />
            ) : null
          }
        />
      </SimpleGrid>
      
      {/* Stats Chart */}
      {statsData.length > 0 && (
        <Box
          bg={useColorModeValue('white', 'gray.700')}
          shadow={'xl'}
          rounded={'lg'}
          p={6}
          mb={6}
          height="400px"
        >
          <Heading as="h2" size="md" mb={6}>
            Points History
          </Heading>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={statsData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="points"
                name="Points"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="workUnits"
                name="Work Units"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
      
      {/* Instances Table */}
      <Box
        bg={useColorModeValue('white', 'gray.700')}
        shadow={'xl'}
        rounded={'lg'}
        p={6}
        mb={6}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="md">
            Folding Instances
          </Heading>
          <Button
            leftIcon={<FiRefreshCw />}
            size="sm"
            onClick={() => {
              instancesQuery.refetch();
              statsQuery.refetch();
            }}
            isLoading={instancesQuery.isFetching || statsQuery.isFetching}
          >
            Refresh
          </Button>
        </Flex>
        
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Instance ID</Th>
                <Th>Type</Th>
                <Th>Region</Th>
                <Th>Folding Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {runningInstances.length > 0 ? (
                runningInstances.map(instance => (
                  <InstanceRow
                    key={instance.id}
                    instance={instance}
                    onApplyConfig={handleApplyConfig}
                  />
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} textAlign="center">
                    No running instances found.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* GPU Performance Comparison */}
      <Box
        bg={useColorModeValue('white', 'gray.700')}
        shadow={'xl'}
        rounded={'lg'}
        p={6}
        mb={6}
      >
        <Heading as="h2" size="md" mb={4}>
          GPU Performance Comparison
        </Heading>
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Performance/Price</Tab>
            <Tab>Raw Performance</Tab>
            <Tab>Availability</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Box height="300px">
                <Text mb={4} fontSize="sm">
                  This chart shows the relative performance per dollar for different GPU instance types.
                  Higher values indicate better cost efficiency for Folding@Home workloads.
                </Text>
                <GpuPerformanceChart
                  chartType="performancePerDollar"
                  instances={runningInstances}
                />
              </Box>
            </TabPanel>
            <TabPanel>
              <Box height="300px">
                <Text mb={4} fontSize="sm">
                  This chart shows the raw performance of different GPU instance types.
                  Higher values indicate faster completion of Folding@Home work units.
                </Text>
                <GpuPerformanceChart
                  chartType="rawPerformance"
                  instances={runningInstances}
                />
              </Box>
            </TabPanel>
            <TabPanel>
              <Box height="300px">
                <Text mb={4} fontSize="sm">
                  This chart shows the availability of different GPU instance types in the spot market.
                  Higher values indicate more reliable availability with fewer interruptions.
                </Text>
                <GpuPerformanceChart
                  chartType="availability"
                  instances={runningInstances}
                />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* Configuration Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Folding@Home Configuration</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired isInvalid={!!errors.user}>
                  <FormLabel>Username</FormLabel>
                  <Input
                    name="user"
                    value={formData.user}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.user}</FormErrorMessage>
                </FormControl>
                
                <FormControl isRequired isInvalid={!!errors.team}>
                  <FormLabel>Team ID</FormLabel>
                  <Input
                    name="team"
                    value={formData.team}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.team}</FormErrorMessage>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Passkey (optional)</FormLabel>
                  <Input
                    name="passkey"
                    value={formData.passkey}
                    onChange={handleChange}
                    placeholder="For bonus points"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Power Level</FormLabel>
                  <Select
                    name="power"
                    value={formData.power}
                    onChange={handleChange}
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="full">Full</option>
                  </Select>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit}
              isLoading={saveConfigMutation.isLoading}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

/**
 * Instance row component
 * @param {Object} props - Component props
 * @param {Object} props.instance - Instance data
 * @param {Function} props.onApplyConfig - Apply config handler
 */
const InstanceRow = ({ instance, onApplyConfig }) => {
  // Fetch folding status for this instance
  const { data: foldingStatus, isLoading } = useQuery({
    queryKey: ['foldingStatus', instance.id],
    queryFn: () => FoldingService.getInstanceStatus(instance.id),
    enabled: !!instance.id,
  });
  
  return (
    <Tr>
      <Td>{instance.instanceId}</Td>
      <Td>
        <VStack align="start" spacing={1}>
          <Text>{instance.instanceType}</Text>
          <Text fontSize="xs" color="gray.500">
            {getGpuModel(instance.instanceType)}
          </Text>
        </VStack>
      </Td>
      <Td>{instance.region}</Td>
      <Td>
        {isLoading ? (
          <Spinner size="sm" />
        ) : foldingStatus ? (
          <VStack align="start" spacing={1}>
            <HStack>
              <Badge colorScheme="green">Active</Badge>
              <Text fontSize="sm">
                {foldingStatus.points || 0} pts / {foldingStatus.workUnits || 0} WUs
              </Text>
            </HStack>
            {foldingStatus.gpuMetrics && (
              <HStack>
                <Badge colorScheme="purple" variant="outline" size="sm">
                  {foldingStatus.gpuMetrics.pointsPerDollar.toFixed(2)} pts/$
                </Badge>
                <Badge colorScheme="blue" variant="outline" size="sm">
                  ~{foldingStatus.gpuMetrics.estimatedTimeRemaining.toFixed(1)}h remaining
                </Badge>
              </HStack>
            )}
          </VStack>
        ) : (
          <Badge colorScheme="yellow">Not configured</Badge>
        )}
      </Td>
      <Td>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => onApplyConfig(instance.id)}
        >
          Apply Config
        </Button>
      </Td>
    </Tr>
  );
};

/**
 * Stat card component
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Statistic value
 * @param {React.ReactNode} props.icon - Icon component
 * @param {React.ReactNode} props.helpText - Help text
 */
const StatCard = ({ title, value, icon, helpText }) => {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'5'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded={'lg'}
      bg={useColorModeValue('white', 'gray.700')}
    >
      <Flex justifyContent={'space-between'}>
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight={'medium'} isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize={'2xl'} fontWeight={'medium'}>
            {value}
          </StatNumber>
          {helpText && (
            <StatHelpText>
              {helpText}
            </StatHelpText>
          )}
        </Box>
        <Box
          my={'auto'}
          color={useColorModeValue('gray.800', 'gray.200')}
          alignContent={'center'}
        >
          {icon}
        </Box>
      </Flex>
    </Stat>
  );
};

/**
 * GPU Performance Chart component
 * @param {Object} props - Component props
 * @param {string} props.chartType - Type of chart to display (performancePerDollar, rawPerformance, availability)
 * @param {Array} props.instances - List of instances
 */
const GpuPerformanceChart = ({ chartType, instances }) => {
  // Query for GPU performance data
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['gpuPerformance', chartType],
    queryFn: () => FoldingService.getGpuPerformanceData(chartType),
    enabled: instances.length > 0,
  });
  
  // Generate sample data if no real data is available yet
  const generateSampleData = () => {
    // Define GPU families to include in the chart
    const gpuFamilies = [
      { family: 'g6', name: 'NVIDIA L4', color: '#8884d8' },
      { family: 'g5', name: 'NVIDIA A10G', color: '#82ca9d' },
      { family: 'g6e', name: 'NVIDIA L40S', color: '#ffc658' },
      { family: 'p3', name: 'NVIDIA V100', color: '#ff8042' },
      { family: 'p4d', name: 'NVIDIA A100', color: '#0088fe' },
      { family: 'p5', name: 'NVIDIA H100', color: '#00C49F' }
    ];
    
    // Generate metrics based on chart type
    if (chartType === 'performancePerDollar') {
      return [
        { name: 'g6 (L4)', value: 95, fill: '#8884d8' },
        { name: 'g5 (A10G)', value: 85, fill: '#82ca9d' },
        { name: 'g6e (L40S)', value: 75, fill: '#ffc658' },
        { name: 'p3 (V100)', value: 65, fill: '#ff8042' },
        { name: 'p4d (A100)', value: 55, fill: '#0088fe' },
        { name: 'p5 (H100)', value: 45, fill: '#00C49F' }
      ];
    } else if (chartType === 'rawPerformance') {
      return [
        { name: 'g6 (L4)', value: 65, fill: '#8884d8' },
        { name: 'g5 (A10G)', value: 75, fill: '#82ca9d' },
        { name: 'g6e (L40S)', value: 85, fill: '#ffc658' },
        { name: 'p3 (V100)', value: 70, fill: '#ff8042' },
        { name: 'p4d (A100)', value: 90, fill: '#0088fe' },
        { name: 'p5 (H100)', value: 100, fill: '#00C49F' }
      ];
    } else { // availability
      return [
        { name: 'g6 (L4)', value: 90, fill: '#8884d8' },
        { name: 'g5 (A10G)', value: 85, fill: '#82ca9d' },
        { name: 'g6e (L40S)', value: 70, fill: '#ffc658' },
        { name: 'p3 (V100)', value: 80, fill: '#ff8042' },
        { name: 'p4d (A100)', value: 60, fill: '#0088fe' },
        { name: 'p5 (H100)', value: 40, fill: '#00C49F' }
      ];
    }
  };
  
  // Use real data if available, otherwise use sample data
  const chartData = performanceData || generateSampleData();
  
  // Loading state
  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100%">
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
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" name={getChartLabel(chartType)} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Helper function to get chart label based on chart type
 * @param {string} chartType - Type of chart
 * @returns {string} Chart label
 */
const getChartLabel = (chartType) => {
  switch (chartType) {
    case 'performancePerDollar':
      return 'Performance per Dollar';
    case 'rawPerformance':
      return 'Raw Performance';
    case 'availability':
      return 'Spot Availability';
    default:
      return 'Value';
  }
};

export default FoldingMonitor;
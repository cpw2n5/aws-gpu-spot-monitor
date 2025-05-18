import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Text,
  Flex,
  Icon,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiServer, FiDollarSign, FiCpu, FiAward } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SpotPriceService from '../../services/spotPrice.service';
import InstanceService from '../../services/instance.service';
import FoldingService from '../../services/folding.service';
import PriceHistoryChart from '../spotPrices/PriceHistoryChart';
import InstanceStatusCard from '../instances/InstanceStatusCard';

/**
 * Dashboard component
 */
const Dashboard = () => {
  const [selectedInstanceType, setSelectedInstanceType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  
  // Fetch instance types
  const instanceTypesQuery = useQuery({
    queryKey: ['instanceTypes'],
    queryFn: SpotPriceService.getSupportedInstanceTypes,
  });
  
  // Fetch regions
  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: SpotPriceService.getSupportedRegions,
  });
  
  // Fetch current spot prices
  const spotPricesQuery = useQuery({
    queryKey: ['spotPrices', selectedRegion, selectedInstanceType],
    queryFn: () => SpotPriceService.getCurrentSpotPrices(selectedRegion, selectedInstanceType),
  });
  
  // Fetch instances
  const instancesQuery = useQuery({
    queryKey: ['instances'],
    queryFn: InstanceService.listInstances,
  });
  
  // Fetch folding stats
  const foldingStatsQuery = useQuery({
    queryKey: ['foldingStats'],
    queryFn: () => FoldingService.getStats(),
  });
  
  // Set default instance type and region when data is loaded
  useEffect(() => {
    if (instanceTypesQuery.data?.length && !selectedInstanceType) {
      setSelectedInstanceType(instanceTypesQuery.data[0]);
    }
    
    if (regionsQuery.data?.length && !selectedRegion) {
      setSelectedRegion(regionsQuery.data[0]);
    }
  }, [instanceTypesQuery.data, regionsQuery.data, selectedInstanceType, selectedRegion]);
  
  // Calculate stats
  const activeInstances = instancesQuery.data?.filter(instance => 
    instance.state === 'running' || instance.state === 'pending'
  )?.length || 0;
  
  const averageSpotPrice = spotPricesQuery.data?.prices?.length
    ? spotPricesQuery.data.prices.reduce((sum, price) => sum + parseFloat(price.spotPrice), 0) / 
      spotPricesQuery.data.prices.length
    : 0;
  
  const totalFoldingPoints = foldingStatsQuery.data?.score || 0;
  const totalWorkUnits = foldingStatsQuery.data?.wus || 0;
  
  // Loading state
  if (
    instanceTypesQuery.isLoading ||
    regionsQuery.isLoading ||
    spotPricesQuery.isLoading ||
    instancesQuery.isLoading ||
    foldingStatsQuery.isLoading
  ) {
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
  if (
    instanceTypesQuery.isError ||
    regionsQuery.isError ||
    spotPricesQuery.isError ||
    instancesQuery.isError ||
    foldingStatsQuery.isError
  ) {
    return (
      <Alert status="error" rounded="md">
        <AlertIcon />
        Error loading dashboard data. Please try again later.
      </Alert>
    );
  }

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading as="h1" size="xl" mb={6}>
        Dashboard
      </Heading>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, lg: 8 }}>
        <StatsCard
          title={'Active Instances'}
          stat={activeInstances}
          icon={<Icon as={FiServer} w={8} h={8} />}
        />
        <StatsCard
          title={'Avg. Spot Price'}
          stat={`$${averageSpotPrice.toFixed(4)}`}
          icon={<Icon as={FiDollarSign} w={8} h={8} />}
        />
        <StatsCard
          title={'Folding Points'}
          stat={totalFoldingPoints.toLocaleString()}
          icon={<Icon as={FiAward} w={8} h={8} />}
        />
        <StatsCard
          title={'Work Units'}
          stat={totalWorkUnits.toLocaleString()}
          icon={<Icon as={FiCpu} w={8} h={8} />}
        />
      </SimpleGrid>
      
      {/* Price History Chart */}
      <Box
        mt={10}
        bg={useColorModeValue('white', 'gray.700')}
        shadow={'xl'}
        rounded={'lg'}
        p={6}
      >
        <Heading as="h2" size="md" mb={6}>
          Spot Price Trends
        </Heading>
        <Box h="300px">
          <PriceHistoryChart 
            instanceType={selectedInstanceType} 
            region={selectedRegion}
            days={7}
          />
        </Box>
      </Box>
      
      {/* Active Instances */}
      <Box
        mt={10}
        bg={useColorModeValue('white', 'gray.700')}
        shadow={'xl'}
        rounded={'lg'}
        p={6}
      >
        <Heading as="h2" size="md" mb={6}>
          Active Instances
        </Heading>
        
        {instancesQuery.data?.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {instancesQuery.data
              .filter(instance => instance.state === 'running' || instance.state === 'pending')
              .slice(0, 6)
              .map(instance => (
                <InstanceStatusCard key={instance.id} instance={instance} />
              ))}
          </SimpleGrid>
        ) : (
          <Text>No active instances found.</Text>
        )}
      </Box>
    </Box>
  );
};

/**
 * Stats card component
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.stat - Statistic value
 * @param {React.ReactNode} props.icon - Icon component
 */
const StatsCard = ({ title, stat, icon }) => {
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
            {stat}
          </StatNumber>
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

export default Dashboard;
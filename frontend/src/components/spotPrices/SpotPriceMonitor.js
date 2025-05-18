import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Button,
  Input,
  FormControl,
  FormLabel,
  HStack,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiSearch, FiRefreshCw, FiAlertCircle, FiBell } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import SpotPriceService from '../../services/spotPrice.service';
import PriceHistoryChart from './PriceHistoryChart';

/**
 * SpotPriceMonitor component
 */
const SpotPriceMonitor = () => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedInstanceType, setSelectedInstanceType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('spotPrice');
  const [sortDirection, setSortDirection] = useState('asc');
  const [priceThresholds, setPriceThresholds] = useState({});
  
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
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Set default instance type and region when data is loaded
  useEffect(() => {
    if (instanceTypesQuery.data?.length && !selectedInstanceType) {
      setSelectedInstanceType('');
    }
    
    if (regionsQuery.data?.length && !selectedRegion) {
      setSelectedRegion('');
    }
  }, [instanceTypesQuery.data, regionsQuery.data, selectedInstanceType, selectedRegion]);
  
  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle price threshold change
  const handleThresholdChange = (instanceType, value) => {
    setPriceThresholds({
      ...priceThresholds,
      [instanceType]: value,
    });
  };
  
  // Filter and sort spot prices
  const filteredPrices = spotPricesQuery.data?.prices?.filter(price => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        price.instanceType.toLowerCase().includes(query) ||
        price.availabilityZone.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];
  
  // Sort prices
  const sortedPrices = [...filteredPrices].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle numeric fields
    if (sortField === 'spotPrice') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  // Check if price is above threshold
  const isPriceAboveThreshold = (instanceType, price) => {
    const threshold = priceThresholds[instanceType];
    return threshold && parseFloat(price) > parseFloat(threshold);
  };
  
  // Loading state
  if (
    instanceTypesQuery.isLoading ||
    regionsQuery.isLoading ||
    spotPricesQuery.isLoading
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
    spotPricesQuery.isError
  ) {
    return (
      <Alert status="error" rounded="md">
        <AlertIcon />
        Error loading spot price data. Please try again later.
      </Alert>
    );
  }

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading as="h1" size="xl" mb={6}>
        Spot Price Monitor
      </Heading>
      
      {/* Filters */}
      <Box
        bg={useColorModeValue('white', 'gray.700')}
        shadow={'md'}
        rounded={'lg'}
        p={6}
        mb={6}
      >
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <FormControl>
            <FormLabel>Region</FormLabel>
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              placeholder="All Regions"
            >
              {regionsQuery.data?.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Instance Type</FormLabel>
            <Select
              value={selectedInstanceType}
              onChange={(e) => setSelectedInstanceType(e.target.value)}
              placeholder="All Instance Types"
            >
              {instanceTypesQuery.data?.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Search</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search by instance type or AZ"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <InputRightElement>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon={<FiRefreshCw />}
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  />
                </InputRightElement>
              )}
            </InputGroup>
          </FormControl>
        </SimpleGrid>
      </Box>
      
      {/* Price History Chart */}
      {selectedInstanceType && (
        <Box
          bg={useColorModeValue('white', 'gray.700')}
          shadow={'xl'}
          rounded={'lg'}
          p={6}
          mb={6}
          height="400px"
        >
          <Heading as="h2" size="md" mb={6}>
            Price History for {selectedInstanceType}
          </Heading>
          <PriceHistoryChart 
            instanceType={selectedInstanceType} 
            region={selectedRegion}
            days={7}
          />
        </Box>
      )}
      
      {/* Spot Prices Table */}
      <Box
        bg={useColorModeValue('white', 'gray.700')}
        shadow={'xl'}
        rounded={'lg'}
        p={6}
        overflowX="auto"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="md">
            Current Spot Prices
          </Heading>
          <HStack>
            <Text fontSize="sm" color="gray.500">
              Last updated: {new Date().toLocaleString()}
            </Text>
            <Button
              leftIcon={<FiRefreshCw />}
              size="sm"
              onClick={() => spotPricesQuery.refetch()}
              isLoading={spotPricesQuery.isFetching}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>
        
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th 
                  cursor="pointer" 
                  onClick={() => handleSort('instanceType')}
                >
                  Instance Type
                  {sortField === 'instanceType' && (
                    <Text as="span" ml={1}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </Text>
                  )}
                </Th>
                <Th 
                  cursor="pointer" 
                  onClick={() => handleSort('availabilityZone')}
                >
                  Availability Zone
                  {sortField === 'availabilityZone' && (
                    <Text as="span" ml={1}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </Text>
                  )}
                </Th>
                <Th 
                  cursor="pointer" 
                  onClick={() => handleSort('spotPrice')}
                  isNumeric
                >
                  Spot Price
                  {sortField === 'spotPrice' && (
                    <Text as="span" ml={1}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </Text>
                  )}
                </Th>
                <Th>Price Threshold</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedPrices.length > 0 ? (
                sortedPrices.map((price, index) => (
                  <Tr key={index}>
                    <Td>{price.instanceType}</Td>
                    <Td>{price.availabilityZone}</Td>
                    <Td isNumeric>
                      <HStack justify="flex-end" spacing={2}>
                        <Text>${parseFloat(price.spotPrice).toFixed(4)}</Text>
                        {isPriceAboveThreshold(price.instanceType, price.spotPrice) && (
                          <Tooltip label="Price above threshold">
                            <Box>
                              <FiAlertCircle color="red" />
                            </Box>
                          </Tooltip>
                        )}
                      </HStack>
                    </Td>
                    <Td>
                      <InputGroup size="sm">
                        <InputLeftElement pointerEvents="none">
                          <Text color="gray.500">$</Text>
                        </InputLeftElement>
                        <Input
                          placeholder="Set threshold"
                          value={priceThresholds[price.instanceType] || ''}
                          onChange={(e) => handleThresholdChange(price.instanceType, e.target.value)}
                          type="number"
                          step="0.0001"
                          min="0"
                        />
                        <InputRightElement>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            icon={<FiBell />}
                            aria-label="Set alert"
                            isDisabled={!priceThresholds[price.instanceType]}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={4} textAlign="center">
                    No spot prices found.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default SpotPriceMonitor;
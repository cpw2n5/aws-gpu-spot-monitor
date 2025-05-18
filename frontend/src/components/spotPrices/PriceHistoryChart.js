import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Box,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import SpotPriceService from '../../services/spotPrice.service';

/**
 * Price history chart component
 * @param {Object} props - Component props
 * @param {string} props.instanceType - EC2 instance type
 * @param {string} props.region - AWS region
 * @param {number} props.days - Number of days of history
 */
const PriceHistoryChart = ({ instanceType, region, days = 7 }) => {
  // Fetch price history data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['spotPriceHistory', instanceType, region, days],
    queryFn: () => SpotPriceService.getSpotPriceHistory(instanceType, region, days),
    enabled: !!instanceType,
  });

  // Format data for chart
  const formatChartData = (data) => {
    if (!data || !data.prices || data.prices.length === 0) {
      return [];
    }

    // Group prices by timestamp and calculate average for each region
    const pricesByTimestamp = data.prices.reduce((acc, price) => {
      const timestamp = new Date(price.timestamp).getTime();
      if (!acc[timestamp]) {
        acc[timestamp] = {
          timestamp,
          date: new Date(price.timestamp).toLocaleString(),
        };
      }
      
      const regionKey = price.availabilityZone.slice(0, -1); // Remove the AZ letter
      if (!acc[timestamp][regionKey]) {
        acc[timestamp][regionKey] = [];
      }
      
      acc[timestamp][regionKey].push(parseFloat(price.spotPrice));
      
      return acc;
    }, {});
    
    // Calculate average price for each region at each timestamp
    return Object.values(pricesByTimestamp).map(point => {
      const result = { timestamp: point.timestamp, date: point.date };
      
      Object.keys(point).forEach(key => {
        if (key !== 'timestamp' && key !== 'date') {
          const prices = point[key];
          result[key] = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        }
      });
      
      return result;
    }).sort((a, b) => a.timestamp - b.timestamp);
  };

  // Generate colors for each region
  const getRegionColors = (data) => {
    if (!data || !data.length) return {};
    
    const regions = Object.keys(data[0]).filter(key => 
      key !== 'timestamp' && key !== 'date'
    );
    
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe',
      '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
    ];
    
    return regions.reduce((acc, region, index) => {
      acc[region] = colors[index % colors.length];
      return acc;
    }, {});
  };

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Spinner 
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert status="error" rounded="md">
        <AlertIcon />
        Error loading price history data. Please try again later.
      </Alert>
    );
  }

  // No data state
  if (!data || !data.prices || data.prices.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        border="1px dashed"
        borderColor={useColorModeValue('gray.300', 'gray.600')}
        borderRadius="md"
      >
        <Text color={useColorModeValue('gray.500', 'gray.400')}>
          No price history data available for {instanceType} in {region || 'any region'}.
        </Text>
      </Box>
    );
  }

  const chartData = formatChartData(data);
  const regionColors = getRegionColors(chartData);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis 
          tickFormatter={(value) => `$${value.toFixed(4)}`}
          domain={['dataMin', 'dataMax']}
        />
        <Tooltip 
          formatter={(value) => [`$${value.toFixed(4)}`, 'Price']}
          labelFormatter={(label) => new Date(label).toLocaleString()}
        />
        <Legend />
        {Object.keys(regionColors).map((region) => (
          <Line
            key={region}
            type="monotone"
            dataKey={region}
            name={region}
            stroke={regionColors[region]}
            activeDot={{ r: 8 }}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceHistoryChart;
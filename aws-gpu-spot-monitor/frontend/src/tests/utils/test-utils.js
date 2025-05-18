import React from 'react';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a custom render function that includes providers
const customRender = (ui, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  const AllProviders = ({ children }) => {
    return (
      <ChakraProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      </ChakraProvider>
    );
  };

  return render(ui, { wrapper: AllProviders, ...options });
};

// Mock data for tests
const mockSpotPrices = {
  prices: [
    {
      region: 'us-east-1',
      availabilityZone: 'us-east-1a',
      instanceType: 'p3.2xlarge',
      price: 1.2345,
      timestamp: '2025-05-17T10:00:00.000Z'
    },
    {
      region: 'us-east-1',
      availabilityZone: 'us-east-1b',
      instanceType: 'p3.2xlarge',
      price: 1.3456,
      timestamp: '2025-05-17T10:00:00.000Z'
    },
    {
      region: 'us-west-2',
      availabilityZone: 'us-west-2a',
      instanceType: 'g4dn.xlarge',
      price: 0.5678,
      timestamp: '2025-05-17T10:00:00.000Z'
    }
  ],
  anomalies: [],
  correlationId: '123e4567-e89b-12d3-a456-426614174000'
};

const mockSpotPriceHistory = [
  {
    region: 'us-east-1',
    availabilityZone: 'us-east-1a',
    instanceType: 'p3.2xlarge',
    price: 1.2345,
    timestamp: '2025-05-17T10:00:00.000Z'
  },
  {
    region: 'us-east-1',
    availabilityZone: 'us-east-1a',
    instanceType: 'p3.2xlarge',
    price: 1.2000,
    timestamp: '2025-05-16T10:00:00.000Z'
  },
  {
    region: 'us-east-1',
    availabilityZone: 'us-east-1a',
    instanceType: 'p3.2xlarge',
    price: 1.1800,
    timestamp: '2025-05-15T10:00:00.000Z'
  }
];

const mockInstances = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-123',
    spotRequestId: 'sir-123456',
    region: 'us-east-1',
    instanceType: 'p3.2xlarge',
    maxPrice: 1.5,
    status: 'active',
    statusCode: 'fulfilled',
    statusMessage: 'Your Spot request is fulfilled.',
    ec2InstanceId: 'i-12345678',
    publicDnsName: 'ec2-12-34-56-78.compute-1.amazonaws.com',
    publicIpAddress: '12.34.56.78',
    foldingConfig: {
      user: 'testuser',
      team: '12345',
      passkey: 'abc123',
      power: 'full'
    },
    createdAt: '2025-05-17T10:00:00.000Z',
    updatedAt: '2025-05-17T10:30:00.000Z'
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    userId: 'user-123',
    spotRequestId: 'sir-234567',
    region: 'us-west-2',
    instanceType: 'g4dn.xlarge',
    maxPrice: 0.7,
    status: 'open',
    statusCode: 'pending-evaluation',
    statusMessage: 'Your Spot request is pending evaluation.',
    ec2InstanceId: null,
    publicDnsName: null,
    publicIpAddress: null,
    foldingConfig: null,
    createdAt: '2025-05-17T11:00:00.000Z',
    updatedAt: '2025-05-17T11:00:00.000Z'
  }
];

const mockFoldingConfig = {
  id: '323e4567-e89b-12d3-a456-426614174002',
  userId: 'user-123',
  user: 'testuser',
  team: '12345',
  passkey: 'abc123',
  power: 'full',
  createdAt: '2025-05-17T09:00:00.000Z',
  updatedAt: '2025-05-17T09:00:00.000Z'
};

const mockFoldingStats = {
  user: 'testuser',
  team: '12345',
  score: 1000000,
  wus: 500,
  rank: 10000,
  active_clients: 2,
  last_updated: '2025-05-17T12:00:00.000Z',
  history: [
    {
      date: '2025-05-17',
      points: 1000000,
      wus: 500
    },
    {
      date: '2025-05-16',
      points: 990000,
      wus: 495
    },
    {
      date: '2025-05-15',
      points: 980000,
      wus: 490
    }
  ]
};

const mockFoldingStatus = {
  instanceId: '123e4567-e89b-12d3-a456-426614174000',
  status: 'running',
  message: 'Folding@Home is running',
  config: {
    user: 'testuser',
    team: '12345',
    passkey: 'abc123',
    power: 'full'
  },
  stats: mockFoldingStats,
  healthScore: 95,
  hasInterruptionWarning: false,
  progress: 75,
  correlationId: '423e4567-e89b-12d3-a456-426614174003'
};

// Mock service responses
const mockServiceResponses = {
  // SpotPrice service mocks
  getSupportedInstanceTypes: ['p3.2xlarge', 'p3.8xlarge', 'g4dn.xlarge', 'g4dn.2xlarge'],
  getSupportedRegions: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'],
  getCurrentSpotPrices: mockSpotPrices,
  getSpotPriceHistory: mockSpotPriceHistory,
  
  // Instance service mocks
  listInstances: mockInstances,
  getInstance: mockInstances[0],
  requestSpotInstance: mockInstances[0],
  updateInstanceStatus: mockInstances[0],
  terminateInstance: { success: true, message: 'Instance terminated successfully', instance: mockInstances[0] },
  
  // Folding service mocks
  getConfiguration: mockFoldingConfig,
  saveConfiguration: mockFoldingConfig,
  deleteConfiguration: { success: true, message: 'Configuration deleted successfully' },
  applyConfigurationToInstance: { success: true, message: 'Configuration applied successfully', instance: mockInstances[0] },
  getStats: mockFoldingStats,
  getInstanceStatus: mockFoldingStatus
};

// Setup mock for a specific service function
const setupServiceMock = (service, method, mockImplementation) => {
  if (typeof service[method] === 'function') {
    jest.spyOn(service, method).mockImplementation(mockImplementation);
  }
};

// Reset all mocks
const resetMocks = () => {
  jest.clearAllMocks();
};

export {
  customRender as render,
  mockSpotPrices,
  mockSpotPriceHistory,
  mockInstances,
  mockFoldingConfig,
  mockFoldingStats,
  mockFoldingStatus,
  mockServiceResponses,
  setupServiceMock,
  resetMocks
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
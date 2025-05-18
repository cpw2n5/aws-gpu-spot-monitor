/**
 * Mock data for testing
 */

// Mock spot price data
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

// Mock spot price history
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

// Mock instance data
const mockInstance = {
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
  foldingConfig: JSON.stringify({
    user: 'testuser',
    team: '12345',
    passkey: 'abc123',
    power: 'full'
  }),
  createdAt: '2025-05-17T10:00:00.000Z',
  updatedAt: '2025-05-17T10:30:00.000Z'
};

// Mock instances list
const mockInstances = [
  mockInstance,
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

// Mock folding configuration
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

// Mock folding stats
const mockFoldingStats = {
  user: 'testuser',
  team: '12345',
  score: 1000000,
  wus: 500,
  rank: 10000,
  active_clients: 2,
  last_updated: '2025-05-17T12:00:00.000Z'
};

// Mock folding instance status
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

// Mock notification preferences
const mockNotificationPreferences = {
  id: '523e4567-e89b-12d3-a456-426614174004',
  userId: 'user-123',
  channels: [
    {
      type: 'email',
      email: 'test@example.com'
    },
    {
      type: 'slack',
      webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
    }
  ],
  severityLevels: ['info', 'warning', 'error', 'critical'],
  createdAt: '2025-05-17T08:00:00.000Z',
  updatedAt: '2025-05-17T08:00:00.000Z'
};

// Mock notification logs
const mockNotificationLogs = [
  {
    id: '623e4567-e89b-12d3-a456-426614174005',
    userId: 'user-123',
    subject: 'Spot Price Alert',
    message: 'Spot price for p3.2xlarge in us-east-1 has increased by 20%',
    severity: 'warning',
    metadata: {
      instanceType: 'p3.2xlarge',
      region: 'us-east-1',
      previousPrice: 1.0,
      currentPrice: 1.2
    },
    deliveryResults: [
      {
        channel: 'email',
        success: true,
        result: { MessageId: 'mock-message-id' }
      }
    ],
    timestamp: '2025-05-17T13:00:00.000Z'
  }
];

// Mock AWS responses
const mockAwsResponses = {
  spotPriceHistory: {
    SpotPriceHistory: [
      {
        AvailabilityZone: 'us-east-1a',
        InstanceType: 'p3.2xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.2345',
        Timestamp: new Date('2025-05-17T10:00:00.000Z')
      },
      {
        AvailabilityZone: 'us-east-1b',
        InstanceType: 'p3.2xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.3456',
        Timestamp: new Date('2025-05-17T10:00:00.000Z')
      }
    ]
  },
  spotInstanceRequest: {
    SpotInstanceRequests: [
      {
        SpotInstanceRequestId: 'sir-123456',
        State: 'active',
        Status: {
          Code: 'fulfilled',
          Message: 'Your Spot request is fulfilled.'
        },
        InstanceId: 'i-12345678'
      }
    ]
  },
  ec2Instance: {
    Reservations: [
      {
        Instances: [
          {
            InstanceId: 'i-12345678',
            PublicDnsName: 'ec2-12-34-56-78.compute-1.amazonaws.com',
            PublicIpAddress: '12.34.56.78'
          }
        ]
      }
    ]
  }
};

module.exports = {
  mockSpotPrices,
  mockSpotPriceHistory,
  mockInstance,
  mockInstances,
  mockFoldingConfig,
  mockFoldingStats,
  mockFoldingStatus,
  mockNotificationPreferences,
  mockNotificationLogs,
  mockAwsResponses
};
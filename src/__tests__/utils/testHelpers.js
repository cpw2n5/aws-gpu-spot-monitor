/**
 * Test helper utilities
 */
const { v4: uuidv4 } = require('uuid');

// Mock DynamoDB functions
const mockDynamoDb = {
  getItem: jest.fn(),
  putItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  queryItems: jest.fn(),
  scanItems: jest.fn()
};

// Reset all mocks between tests
const resetMocks = () => {
  jest.clearAllMocks();
  
  // Reset DynamoDB mocks
  mockDynamoDb.getItem.mockReset();
  mockDynamoDb.putItem.mockReset();
  mockDynamoDb.updateItem.mockReset();
  mockDynamoDb.deleteItem.mockReset();
  mockDynamoDb.queryItems.mockReset();
  mockDynamoDb.scanItems.mockReset();
};

// Generate a mock Express request object
const mockRequest = (overrides = {}) => {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: { id: 'user-123' },
    ...overrides
  };
  return req;
};

// Generate a mock Express response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

// Generate a mock Express next function
const mockNext = jest.fn();

// Create a mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  withCorrelationId: jest.fn().mockImplementation((fn, correlationId) => fn())
};

// Create a mock AWS EC2 client
const createMockEC2Client = (responses = {}) => {
  return {
    send: jest.fn().mockImplementation((command) => {
      if (command.constructor.name === 'DescribeSpotPriceHistoryCommand') {
        return Promise.resolve(responses.spotPriceHistory || { SpotPriceHistory: [] });
      }
      if (command.constructor.name === 'RequestSpotInstancesCommand') {
        return Promise.resolve(responses.requestSpotInstances || { 
          SpotInstanceRequests: [{ 
            SpotInstanceRequestId: 'sir-123456',
            State: 'open',
            Status: { Code: 'pending-evaluation', Message: 'Your Spot request is pending evaluation.' }
          }] 
        });
      }
      if (command.constructor.name === 'DescribeSpotInstanceRequestsCommand') {
        return Promise.resolve(responses.describeSpotInstanceRequests || { 
          SpotInstanceRequests: [{ 
            SpotInstanceRequestId: 'sir-123456',
            State: 'active',
            Status: { Code: 'fulfilled', Message: 'Your Spot request is fulfilled.' },
            InstanceId: 'i-12345678'
          }] 
        });
      }
      if (command.constructor.name === 'DescribeInstancesCommand') {
        return Promise.resolve(responses.describeInstances || { 
          Reservations: [{ 
            Instances: [{ 
              InstanceId: 'i-12345678',
              PublicDnsName: 'ec2-12-34-56-78.compute-1.amazonaws.com',
              PublicIpAddress: '12.34.56.78'
            }] 
          }] 
        });
      }
      if (command.constructor.name === 'CancelSpotInstanceRequestsCommand') {
        return Promise.resolve(responses.cancelSpotInstanceRequests || {});
      }
      if (command.constructor.name === 'TerminateInstancesCommand') {
        return Promise.resolve(responses.terminateInstances || {});
      }
      if (command.constructor.name === 'CreateTagsCommand') {
        return Promise.resolve(responses.createTags || {});
      }
      return Promise.resolve({});
    })
  };
};

// Create a mock axios instance
const createMockAxios = (responses = {}) => {
  return {
    get: jest.fn().mockImplementation((url) => {
      if (url.includes('stats.foldingathome.org')) {
        return Promise.resolve({ data: responses.foldingStats || {} });
      }
      return Promise.resolve({ data: {} });
    }),
    post: jest.fn().mockImplementation((url) => {
      if (url.includes('hooks.slack.com')) {
        return Promise.resolve({ status: 200 });
      }
      return Promise.resolve({ status: 200 });
    })
  };
};

// Generate a random correlation ID for testing
const generateCorrelationId = () => uuidv4();

module.exports = {
  mockDynamoDb,
  resetMocks,
  mockRequest,
  mockResponse,
  mockNext,
  mockLogger,
  createMockEC2Client,
  createMockAxios,
  generateCorrelationId
};
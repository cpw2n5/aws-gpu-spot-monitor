// Set up environment variables for testing
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_TABLE_PREFIX = 'test-';
process.env.NODE_ENV = 'test';

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockSNS = {
    publish: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ MessageId: 'mock-message-id' })
    })
  };
  
  const mockSES = {
    sendEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ MessageId: 'mock-message-id' })
    })
  };

  return {
    SNS: jest.fn(() => mockSNS),
    SES: jest.fn(() => mockSES)
  };
});

// Mock AWS SDK v3
jest.mock('@aws-sdk/client-ec2', () => {
  return {
    EC2Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({})
    })),
    DescribeSpotPriceHistoryCommand: jest.fn(),
    RequestSpotInstancesCommand: jest.fn(),
    DescribeSpotInstanceRequestsCommand: jest.fn(),
    CancelSpotInstanceRequestsCommand: jest.fn(),
    DescribeInstancesCommand: jest.fn(),
    TerminateInstancesCommand: jest.fn(),
    CreateTagsCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({})
    }))
  };
});

jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({})
      })
    },
    GetCommand: jest.fn(),
    PutCommand: jest.fn(),
    UpdateCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    QueryCommand: jest.fn(),
    ScanCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({})
    }))
  };
});

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ status: 200 })
}));

// Global console mocks to reduce noise in tests
global.console.log = jest.fn();
global.console.info = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();
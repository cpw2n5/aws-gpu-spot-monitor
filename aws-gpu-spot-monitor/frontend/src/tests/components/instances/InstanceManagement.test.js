import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, mockServiceResponses, resetMocks } from '../../utils/test-utils';
import InstanceManagement from '../../../components/instances/InstanceManagement';
import InstanceService from '../../../services/instance.service';
import { useQuery, useMutation } from '@tanstack/react-query';

// Mock the services
jest.mock('../../../services/instance.service');

// Mock the useDisclosure hook from Chakra UI
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  return {
    ...originalModule,
    useDisclosure: () => ({
      isOpen: false,
      onOpen: jest.fn(),
      onClose: jest.fn()
    }),
    useToast: () => jest.fn()
  };
});

describe('InstanceManagement Component', () => {
  beforeEach(() => {
    resetMocks();
    
    // Mock useQuery hook
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instances') {
        return {
          data: mockServiceResponses.listInstances,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Mock useMutation hook
    useMutation.mockImplementation(({ mutationFn }) => {
      if (mutationFn === InstanceService.terminateInstance) {
        return {
          mutate: jest.fn(),
          isLoading: false,
          isError: false,
          error: null
        };
      }
      if (mutationFn === InstanceService.requestSpotInstance) {
        return {
          mutate: jest.fn(),
          isLoading: false,
          isError: false,
          error: null
        };
      }
      return {
        mutate: jest.fn(),
        isLoading: false,
        isError: false,
        error: null
      };
    });
    
    // Mock service methods
    InstanceService.listInstances.mockResolvedValue(mockServiceResponses.listInstances);
    InstanceService.terminateInstance.mockResolvedValue(mockServiceResponses.terminateInstance);
    InstanceService.requestSpotInstance.mockResolvedValue(mockServiceResponses.requestSpotInstance);
  });

  it('renders the component with instance data', async () => {
    // Render the component
    render(<InstanceManagement />);
    
    // Check if the component title is rendered
    expect(screen.getByText('Instance Management')).toBeInTheDocument();
    
    // Check if the "Request New Instance" button is rendered
    expect(screen.getByText('Request New Instance')).toBeInTheDocument();
    
    // Check if the instance stats are rendered
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    expect(screen.getByText('Terminated')).toBeInTheDocument();
    
    // Check if the instances tabs are rendered
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    
    // Check if the refresh button is rendered
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    
    // Wait for the instances to be rendered
    await waitFor(() => {
      // Check if at least one instance is rendered
      expect(screen.getByText('p3.2xlarge')).toBeInTheDocument();
    });
    expect(screen.getByText('us-east-1')).toBeInTheDocument();

  });

  it('filters instances by tab selection', async () => {
    // Mock instances with different states
    const mockInstancesWithDifferentStates = [
      {
        ...mockServiceResponses.listInstances[0],
        state: 'running'
      },
      {
        ...mockServiceResponses.listInstances[1],
        state: 'pending'
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        userId: 'user-123',
        spotRequestId: 'sir-345678',
        region: 'us-west-1',
        instanceType: 'g4dn.2xlarge',
        maxPrice: 0.8,
        state: 'stopped',
        statusCode: 'stopped',
        statusMessage: 'Instance stopped',
        ec2InstanceId: 'i-23456789',
        publicDnsName: null,
        publicIpAddress: null,
        foldingConfig: null,
        createdAt: '2025-05-17T12:00:00.000Z',
        updatedAt: '2025-05-17T12:30:00.000Z'
      }
    ];
    
    // Mock useQuery to return instances with different states
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instances') {
        return {
          data: mockInstancesWithDifferentStates,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Render the component
    render(<InstanceManagement />);
    
    // Check if all instances are initially rendered
    await waitFor(() => {
      expect(screen.getByText('p3.2xlarge')).toBeInTheDocument();
    });

    expect(screen.getByText('g4dn.xlarge')).toBeInTheDocument();
    expect(screen.getByText('g4dn.2xlarge')).toBeInTheDocument();

    // Click on the "Running" tab
    const runningTab = screen.getAllByText('Running')[1]; // Get the tab, not the stat card
    fireEvent.click(runningTab);
    
    // Check if only running instances are rendered
    await waitFor(() => {
      expect(screen.getByText('p3.2xlarge')).toBeInTheDocument();
    });

    expect(screen.queryByText('g4dn.xlarge')).not.toBeInTheDocument();
    expect(screen.queryByText('g4dn.2xlarge')).not.toBeInTheDocument();

    // Click on the "Pending" tab
    const pendingTab = screen.getByText('Pending');
    fireEvent.click(pendingTab);
    
    // Check if only pending instances are rendered
    await waitFor(() => {
      expect(screen.queryByText('p3.2xlarge')).not.toBeInTheDocument();
    });
    expect(screen.getByText('g4dn.xlarge')).toBeInTheDocument();
    expect(screen.queryByText('g4dn.2xlarge')).not.toBeInTheDocument();

    // Click on the "Stopped" tab
    const stoppedTab = screen.getByText('Stopped');
    fireEvent.click(stoppedTab);
    
    // Check if only stopped instances are rendered
    await waitFor(() => {
      expect(screen.queryByText('p3.2xlarge')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('g4dn.xlarge')).not.toBeInTheDocument();
    expect(screen.getByText('g4dn.2xlarge')).toBeInTheDocument();

    // Click on the "All" tab
    const allTab = screen.getByText('All');
    fireEvent.click(allTab);
    
    // Check if all instances are rendered again
    await waitFor(() => {
      expect(screen.getByText('p3.2xlarge')).toBeInTheDocument();
    });
    expect(screen.getByText('g4dn.xlarge')).toBeInTheDocument();
    expect(screen.getByText('g4dn.2xlarge')).toBeInTheDocument();

  });

  it('shows loading state when data is loading', async () => {
    // Mock loading state
    useQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn()
    }));
    
    // Render the component
    render(<InstanceManagement />);
    
    // Check if the loading spinner is rendered
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when data fetching fails', async () => {
    // Mock error state
    useQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn()
    }));
    
    // Render the component
    render(<InstanceManagement />);
    
    // Check if the error message is rendered
    expect(screen.getByText('Error loading instance data. Please try again later.')).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    // Create a mock refetch function
    const mockRefetch = jest.fn();
    
    // Mock the useQuery hook with the mock refetch function
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instances') {
        return {
          data: mockServiceResponses.listInstances,
          isLoading: false,
          isError: false,
          refetch: mockRefetch
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Render the component
    render(<InstanceManagement />);
    
    // Click the refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Check if the refetch function was called
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows "No instances found" when there are no instances', async () => {
    // Mock empty instances list
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instances') {
        return {
          data: [],
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Render the component
    render(<InstanceManagement />);
    
    // Check if the "No instances found" message is rendered
    await waitFor(() => {
      expect(screen.getByText('No instances found.')).toBeInTheDocument();
    });
  });

  it('displays correct instance counts in stat cards', async () => {
    // Mock instances with different states
    const mockInstancesWithDifferentStates = [
      {
        ...mockServiceResponses.listInstances[0],
        state: 'running'
      },
      {
        ...mockServiceResponses.listInstances[1],
        state: 'pending'
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        userId: 'user-123',
        spotRequestId: 'sir-345678',
        region: 'us-west-1',
        instanceType: 'g4dn.2xlarge',
        maxPrice: 0.8,
        state: 'stopped',
        statusCode: 'stopped',
        statusMessage: 'Instance stopped',
        ec2InstanceId: 'i-23456789',
        publicDnsName: null,
        publicIpAddress: null,
        foldingConfig: null,
        createdAt: '2025-05-17T12:00:00.000Z',
        updatedAt: '2025-05-17T12:30:00.000Z'
      },
      {
        id: '423e4567-e89b-12d3-a456-426614174003',
        userId: 'user-123',
        spotRequestId: 'sir-456789',
        region: 'us-east-2',
        instanceType: 'p3.8xlarge',
        maxPrice: 2.0,
        state: 'terminated',
        statusCode: 'terminated',
        statusMessage: 'Instance terminated',
        ec2InstanceId: 'i-34567890',
        publicDnsName: null,
        publicIpAddress: null,
        foldingConfig: null,
        createdAt: '2025-05-17T13:00:00.000Z',
        updatedAt: '2025-05-17T13:30:00.000Z'
      }
    ];
    
    // Mock useQuery to return instances with different states
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instances') {
        return {
          data: mockInstancesWithDifferentStates,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Render the component
    render(<InstanceManagement />);
    
    // Check if the stat cards show the correct counts
    await waitFor(() => {
      // Find the stat cards by their labels
      const runningCard = screen.getByText('Running').closest('div');
      const pendingCard = screen.getByText('Pending').closest('div');
      const stoppedCard = screen.getByText('Stopped').closest('div');
      const terminatedCard = screen.getByText('Terminated').closest('div');
      
      // Check the counts
      expect(runningCard).toHaveTextContent('1');
      expect(pendingCard).toHaveTextContent('1');
      expect(stoppedCard).toHaveTextContent('1');
      expect(terminatedCard).toHaveTextContent('1');
    });
  });

  // Note: Testing the modal and form submission would require more complex setup
  // and is often better handled with integration tests
});
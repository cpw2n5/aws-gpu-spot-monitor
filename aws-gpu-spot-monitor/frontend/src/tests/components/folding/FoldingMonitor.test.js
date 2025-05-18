import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, mockServiceResponses, setupServiceMock, resetMocks } from '../../utils/test-utils';
import FoldingMonitor from '../../../components/folding/FoldingMonitor';
import FoldingService from '../../../services/folding.service';
import InstanceService from '../../../services/instance.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mock the services
jest.mock('../../../services/folding.service');
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

describe('FoldingMonitor Component', () => {
  beforeEach(() => {
    resetMocks();
    
    // Mock useQuery hook
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'foldingConfig') {
        return {
          data: mockServiceResponses.getConfiguration,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'foldingStats') {
        return {
          data: mockServiceResponses.getStats,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'instances') {
        return {
          data: mockServiceResponses.listInstances,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'foldingStatus') {
        return {
          data: mockServiceResponses.getInstanceStatus,
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
      if (mutationFn === FoldingService.saveConfiguration) {
        return {
          mutate: jest.fn(),
          isLoading: false,
          isError: false,
          error: null
        };
      }
      if (mutationFn === FoldingService.applyConfigurationToInstance) {
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
    FoldingService.getConfiguration.mockResolvedValue(mockServiceResponses.getConfiguration);
    FoldingService.saveConfiguration.mockResolvedValue(mockServiceResponses.saveConfiguration);
    FoldingService.getStats.mockResolvedValue(mockServiceResponses.getStats);
    FoldingService.getInstanceStatus.mockResolvedValue(mockServiceResponses.getInstanceStatus);
    FoldingService.applyConfigurationToInstance.mockResolvedValue(mockServiceResponses.applyConfigurationToInstance);
    
    InstanceService.listInstances.mockResolvedValue(mockServiceResponses.listInstances);
  });

  it('renders the component with folding data', async () => {
    // Render the component
    render(<FoldingMonitor />);
    
    // Check if the component title is rendered
    expect(screen.getByText('Folding@Home Monitor')).toBeInTheDocument();
    
    // Check if the "Configure" button is rendered
    expect(screen.getByText('Configure')).toBeInTheDocument();
    
    // Check if the stats cards are rendered
    expect(screen.getByText('Total Points')).toBeInTheDocument();
    expect(screen.getByText('Work Units')).toBeInTheDocument();
    expect(screen.getByText('Active Instances')).toBeInTheDocument();
    expect(screen.getByText('24h Points')).toBeInTheDocument();
    
    // Check if the folding instances table is rendered
    expect(screen.getByText('Folding Instances')).toBeInTheDocument();
    
    // Check if the table headers are rendered
    expect(screen.getByText('Instance ID')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('Folding Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Check if the refresh button is rendered
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    
    // Wait for the stats to be rendered
    await waitFor(() => {
      // Check if the stats values are rendered
      expect(screen.getByText('1,000,000')).toBeInTheDocument(); // Total Points
      expect(screen.getByText('500')).toBeInTheDocument(); // Work Units
      
      // Check if at least one instance is rendered in the table
      expect(screen.getByText('p3.2xlarge')).toBeInTheDocument();
      expect(screen.getByText('us-east-1')).toBeInTheDocument();
    });
  });

  it('shows the points history chart when stats data is available', async () => {
    // Render the component
    render(<FoldingMonitor />);
    
    // Check if the chart title is rendered
    await waitFor(() => {
      expect(screen.getByText('Points History')).toBeInTheDocument();
    });
    
    // Check if the chart components are rendered
    // Note: We're using data-testid attributes defined in our mock for Recharts
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('line').length).toBe(2); // Two lines: Points and Work Units
    expect(screen.getAllByTestId('x-axis').length).toBe(1);
    expect(screen.getAllByTestId('y-axis').length).toBe(2); // Two y-axes: left and right
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
    render(<FoldingMonitor />);
    
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
    render(<FoldingMonitor />);
    
    // Check if the error message is rendered
    expect(screen.getByText('Error loading Folding@Home data. Please try again later.')).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    // Create mock refetch functions
    const mockInstancesRefetch = jest.fn();
    const mockStatsRefetch = jest.fn();
    
    // Mock the useQuery hook with the mock refetch functions
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'foldingConfig') {
        return {
          data: mockServiceResponses.getConfiguration,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'foldingStats') {
        return {
          data: mockServiceResponses.getStats,
          isLoading: false,
          isError: false,
          refetch: mockStatsRefetch
        };
      }
      if (queryKey[0] === 'instances') {
        return {
          data: mockServiceResponses.listInstances,
          isLoading: false,
          isError: false,
          refetch: mockInstancesRefetch
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
    render(<FoldingMonitor />);
    
    // Click the refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Check if both refetch functions were called
    expect(mockInstancesRefetch).toHaveBeenCalled();
    expect(mockStatsRefetch).toHaveBeenCalled();
  });

  it('shows "No running instances found" when there are no running instances', async () => {
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
    render(<FoldingMonitor />);
    
    // Check if the "No running instances found" message is rendered
    await waitFor(() => {
      expect(screen.getByText('No running instances found.')).toBeInTheDocument();
    });
  });

  it('opens the configuration modal when Configure button is clicked', async () => {
    // Mock the useDisclosure hook to control the modal state
    const mockOnOpen = jest.fn();
    jest.mock('@chakra-ui/react', () => {
      const originalModule = jest.requireActual('@chakra-ui/react');
      return {
        ...originalModule,
        useDisclosure: () => ({
          isOpen: true, // Set to true to simulate open modal
          onOpen: mockOnOpen,
          onClose: jest.fn()
        }),
        useToast: () => jest.fn()
      };
    });
    
    // Re-render the component with the mocked hook
    render(<FoldingMonitor />);
    
    // Click the Configure button
    const configureButton = screen.getByText('Configure');
    fireEvent.click(configureButton);
    
    // Check if the modal is opened
    expect(mockOnOpen).toHaveBeenCalled();
    
    // Note: Testing the actual modal content is challenging due to the portal rendering
    // In a real test, we would use a more sophisticated approach to test the modal content
  });

  it('displays folding status for running instances', async () => {
    // Mock running instances with folding status
    const runningInstances = [
      {
        ...mockServiceResponses.listInstances[0],
        state: 'running'
      }
    ];
    
    // Mock useQuery to return running instances
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instances') {
        return {
          data: runningInstances,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'foldingStatus') {
        return {
          data: mockServiceResponses.getInstanceStatus,
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
    render(<FoldingMonitor />);
    
    // Check if the folding status is rendered
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('displays correct stats in the stat cards', async () => {
    // Render the component
    render(<FoldingMonitor />);
    
    // Check if the stat cards show the correct values
    await waitFor(() => {
      // Find the stat cards by their titles
      const totalPointsCard = screen.getByText('Total Points').closest('div');
      const workUnitsCard = screen.getByText('Work Units').closest('div');
      const activeInstancesCard = screen.getByText('Active Instances').closest('div');
      const dailyPointsCard = screen.getByText('24h Points').closest('div');
      
      // Check the values
      expect(totalPointsCard).toHaveTextContent('1,000,000');
      expect(workUnitsCard).toHaveTextContent('500');
      
      // Active instances should be the count of running instances
      const runningInstances = mockServiceResponses.listInstances.filter(
        instance => instance.status === 'active'
      );
      expect(activeInstancesCard).toHaveTextContent(runningInstances.length.toString());
    });
  });

  // Note: Testing form submission in the modal would require more complex setup
  // and is often better handled with integration tests
});
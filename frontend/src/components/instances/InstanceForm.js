import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  VStack,
  HStack,
  FormErrorMessage,
  Divider,
  Text,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftElement,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import SpotPriceService from '../../services/spotPrice.service';
import FoldingService from '../../services/folding.service';

/**
 * Instance form component
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Submit handler
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 */
const InstanceForm = ({ onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    instanceType: '',
    region: '',
    maxPrice: '',
    keyName: '',
    securityGroupId: '',
    subnetId: '',
    includeFolding: false,
    foldingConfig: {
      user: '',
      team: '',
      passkey: '',
      power: 'full',
    },
  });
  const [errors, setErrors] = useState({});
  
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
  
  // Fetch current spot prices for selected instance type and region
  const spotPricesQuery = useQuery({
    queryKey: ['spotPrices', formData.region, formData.instanceType],
    queryFn: () => SpotPriceService.getCurrentSpotPrices(formData.region, formData.instanceType),
    enabled: !!formData.region && !!formData.instanceType,
  });
  
  // Fetch folding config
  const foldingConfigQuery = useQuery({
    queryKey: ['foldingConfig'],
    queryFn: FoldingService.getConfiguration,
    onSuccess: (data) => {
      if (data) {
        setFormData(prev => ({
          ...prev,
          foldingConfig: {
            user: data.user || '',
            team: data.team || '',
            passkey: data.passkey || '',
            power: data.power || 'full',
          },
        }));
      }
    },
  });
  
  // Calculate recommended max price
  const calculateRecommendedPrice = () => {
    if (!spotPricesQuery.data?.prices || spotPricesQuery.data.prices.length === 0) {
      return null;
    }
    
    const prices = spotPricesQuery.data.prices.map(p => parseFloat(p.spotPrice));
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    
    // Recommend 20% above the average price, but not more than the current max price
    return Math.min(avgPrice * 1.2, maxPrice).toFixed(4);
  };
  
  const recommendedPrice = calculateRecommendedPrice();
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle folding config change
  const handleFoldingConfigChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      foldingConfig: {
        ...prev.foldingConfig,
        [name]: value,
      },
    }));
    
    // Clear error when field is changed
    if (errors[`foldingConfig.${name}`]) {
      setErrors(prev => ({ ...prev, [`foldingConfig.${name}`]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.instanceType) {
      newErrors.instanceType = 'Instance type is required';
    }
    
    if (!formData.region) {
      newErrors.region = 'Region is required';
    }
    
    if (!formData.maxPrice) {
      newErrors.maxPrice = 'Max price is required';
    } else if (isNaN(parseFloat(formData.maxPrice)) || parseFloat(formData.maxPrice) <= 0) {
      newErrors.maxPrice = 'Max price must be a positive number';
    }
    
    if (formData.includeFolding) {
      if (!formData.foldingConfig.user) {
        newErrors['foldingConfig.user'] = 'Username is required';
      }
      
      if (!formData.foldingConfig.team) {
        newErrors['foldingConfig.team'] = 'Team ID is required';
      }
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
    
    const instanceConfig = {
      instanceType: formData.instanceType,
      region: formData.region,
      maxPrice: formData.maxPrice,
    };
    
    // Add optional fields if provided
    if (formData.keyName) instanceConfig.keyName = formData.keyName;
    if (formData.securityGroupId) instanceConfig.securityGroupId = formData.securityGroupId;
    if (formData.subnetId) instanceConfig.subnetId = formData.subnetId;
    
    // Add folding config if included
    if (formData.includeFolding) {
      instanceConfig.foldingConfig = formData.foldingConfig;
    }
    
    onSubmit(instanceConfig);
  };
  
  // Set recommended price when available
  useEffect(() => {
    if (recommendedPrice && !formData.maxPrice) {
      setFormData(prev => ({
        ...prev,
        maxPrice: recommendedPrice,
      }));
    }
  }, [recommendedPrice, formData.maxPrice]);

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired isInvalid={!!errors.instanceType}>
          <FormLabel>Instance Type</FormLabel>
          <Select
            name="instanceType"
            value={formData.instanceType}
            onChange={handleChange}
            placeholder="Select instance type"
          >
            {instanceTypesQuery.data?.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          <FormErrorMessage>{errors.instanceType}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.region}>
          <FormLabel>Region</FormLabel>
          <Select
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="Select region"
          >
            {regionsQuery.data?.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </Select>
          <FormErrorMessage>{errors.region}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.maxPrice}>
          <FormLabel>
            <HStack>
              <Text>Maximum Price (per hour)</Text>
              {recommendedPrice && (
                <Tooltip label={`Based on current spot prices for ${formData.instanceType} in ${formData.region}`}>
                  <Text fontSize="sm" color="blue.500">
                    Recommended: ${recommendedPrice}
                  </Text>
                </Tooltip>
              )}
            </HStack>
          </FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Text color="gray.500">$</Text>
            </InputLeftElement>
            <NumberInput
              min={0.0001}
              step={0.0001}
              precision={4}
              value={formData.maxPrice}
              onChange={(value) => setFormData(prev => ({ ...prev, maxPrice: value }))}
              width="100%"
            >
              <NumberInputField
                name="maxPrice"
                pl={8}
                placeholder="0.0000"
              />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
          <FormErrorMessage>{errors.maxPrice}</FormErrorMessage>
        </FormControl>
        
        <Divider my={2} />
        
        <Accordion allowToggle>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Advanced Options
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>
                    <HStack>
                      <Text>Key Pair Name</Text>
                      <Tooltip label="EC2 key pair for SSH access">
                        <Icon as={FiInfo} color="gray.500" />
                      </Tooltip>
                    </HStack>
                  </FormLabel>
                  <Input
                    name="keyName"
                    value={formData.keyName}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>
                    <HStack>
                      <Text>Security Group ID</Text>
                      <Tooltip label="EC2 security group for network access">
                        <Icon as={FiInfo} color="gray.500" />
                      </Tooltip>
                    </HStack>
                  </FormLabel>
                  <Input
                    name="securityGroupId"
                    value={formData.securityGroupId}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>
                    <HStack>
                      <Text>Subnet ID</Text>
                      <Tooltip label="VPC subnet for the instance">
                        <Icon as={FiInfo} color="gray.500" />
                      </Tooltip>
                    </HStack>
                  </FormLabel>
                  <Input
                    name="subnetId"
                    value={formData.subnetId}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </FormControl>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        
        <Divider my={2} />
        
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="includeFolding" mb="0">
            Include Folding@Home
          </FormLabel>
          <Switch
            id="includeFolding"
            name="includeFolding"
            isChecked={formData.includeFolding}
            onChange={handleChange}
          />
        </FormControl>
        
        {formData.includeFolding && (
          <Box
            bg={useColorModeValue('gray.50', 'gray.700')}
            p={4}
            borderRadius="md"
          >
            <VStack spacing={4} align="stretch">
              <FormControl isRequired isInvalid={!!errors['foldingConfig.user']}>
                <FormLabel>Folding@Home Username</FormLabel>
                <Input
                  name="user"
                  value={formData.foldingConfig.user}
                  onChange={handleFoldingConfigChange}
                />
                <FormErrorMessage>{errors['foldingConfig.user']}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors['foldingConfig.team']}>
                <FormLabel>Team ID</FormLabel>
                <Input
                  name="team"
                  value={formData.foldingConfig.team}
                  onChange={handleFoldingConfigChange}
                />
                <FormErrorMessage>{errors['foldingConfig.team']}</FormErrorMessage>
              </FormControl>
              
              <FormControl>
                <FormLabel>Passkey (optional)</FormLabel>
                <Input
                  name="passkey"
                  value={formData.foldingConfig.passkey}
                  onChange={handleFoldingConfigChange}
                  placeholder="For bonus points"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Power Level</FormLabel>
                <Select
                  name="power"
                  value={formData.foldingConfig.power}
                  onChange={handleFoldingConfigChange}
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="full">Full</option>
                </Select>
              </FormControl>
            </VStack>
          </Box>
        )}
        
        <Button
          mt={4}
          colorScheme="blue"
          type="submit"
          isLoading={isSubmitting}
          loadingText="Requesting..."
        >
          Request Instance
        </Button>
      </VStack>
    </Box>
  );
};

export default InstanceForm;
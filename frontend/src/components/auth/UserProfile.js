import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  HStack,
  Avatar,
  FormErrorMessage,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stack,
  StackDivider,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * UserProfile component
 */
const UserProfile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToast();
  
  // Initialize form data with current user data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.given_name || '',
        lastName: currentUser.family_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone_number || '',
      });
    }
  }, [currentUser]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateProfile({
        given_name: formData.firstName,
        family_name: formData.lastName,
        phone_number: formData.phone,
      });
      
      setIsEditing(false);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel edit
  const handleCancel = () => {
    // Reset form data to current user data
    if (currentUser) {
      setFormData({
        firstName: currentUser.given_name || '',
        lastName: currentUser.family_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone_number || '',
      });
    }
    
    setErrors({});
    setIsEditing(false);
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    const firstName = formData.firstName || '';
    const lastName = formData.lastName || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading as="h1" size="xl" mb={6}>
        User Profile
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <HStack spacing={4}>
              <Avatar 
                size="xl" 
                name={`${formData.firstName} ${formData.lastName}`} 
                bg="blue.500"
              >
                {getUserInitials()}
              </Avatar>
              <Box>
                <Heading size="md">
                  {currentUser?.given_name} {currentUser?.family_name}
                </Heading>
                <Text pt="2" fontSize="sm">
                  {currentUser?.email}
                </Text>
                {currentUser?.email_verified && (
                  <Badge colorScheme="green">Verified</Badge>
                )}
              </Box>
            </HStack>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing="4">
              <Box>
                <Heading size="xs" textTransform="uppercase">
                  Account Details
                </Heading>
                <SimpleGrid columns={2} spacing={4} mt={2}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      User ID
                    </Text>
                    <Text fontSize="sm" fontFamily="monospace">
                      {currentUser?.sub || 'N/A'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Created At
                    </Text>
                    <Text fontSize="sm">
                      {currentUser?.created_at 
                        ? new Date(currentUser.created_at * 1000).toLocaleDateString() 
                        : 'N/A'}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>
              <Box>
                <Heading size="xs" textTransform="uppercase">
                  Contact Information
                </Heading>
                <SimpleGrid columns={2} spacing={4} mt={2}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Email
                    </Text>
                    <Text fontSize="sm">
                      {currentUser?.email || 'N/A'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Phone
                    </Text>
                    <Text fontSize="sm">
                      {currentUser?.phone_number || 'N/A'}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>
            </Stack>
          </CardBody>
          <CardFooter>
            <Button 
              colorScheme="blue" 
              onClick={() => setIsEditing(true)}
              isDisabled={isEditing}
            >
              Edit Profile
            </Button>
          </CardFooter>
        </Card>
        
        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <Heading size="md">
              {isEditing ? 'Edit Profile' : 'Profile Information'}
            </Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired isInvalid={!!errors.firstName} isDisabled={!isEditing}>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                </FormControl>
                
                <FormControl isRequired isInvalid={!!errors.lastName} isDisabled={!isEditing}>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                </FormControl>
                
                <FormControl isRequired isInvalid={!!errors.email} isDisabled={true}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.phone} isDisabled={!isEditing}>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                  <FormErrorMessage>{errors.phone}</FormErrorMessage>
                </FormControl>
                
                {isEditing && (
                  <HStack spacing={4} pt={4}>
                    <Button
                      colorScheme="blue"
                      type="submit"
                      isLoading={isSubmitting}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      isDisabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </HStack>
                )}
              </VStack>
            </form>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default UserProfile;
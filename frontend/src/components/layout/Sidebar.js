import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  CloseButton,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  useDisclosure,
  BoxProps,
  FlexProps,
} from '@chakra-ui/react';
import {
  FiHome,
  FiTrendingUp,
  FiServer,
  FiSettings,
  FiUser,
  FiCpu,
  FiMenu,
} from 'react-icons/fi';
import { IconType } from 'react-icons';

/**
 * Sidebar link item interface
 * @typedef {Object} LinkItemProps
 * @property {string} name - Display name
 * @property {string} path - URL path
 * @property {IconType} icon - Icon component
 */

/**
 * Sidebar link items
 * @type {Array<LinkItemProps>}
 */
const LinkItems = [
  { name: 'Dashboard', path: '/dashboard', icon: FiHome },
  { name: 'Spot Prices', path: '/spot-prices', icon: FiTrendingUp },
  { name: 'Instances', path: '/instances', icon: FiServer },
  { name: 'Folding@Home', path: '/folding', icon: FiCpu },
  { name: 'Profile', path: '/profile', icon: FiUser },
  { name: 'Settings', path: '/settings', icon: FiSettings },
];

/**
 * Sidebar component for dashboard layout
 * @param {BoxProps} props - Component props
 */
const Sidebar = ({ onClose, ...rest }) => {
  const location = useLocation();

  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
          GPU Monitor
        </Text>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem 
          key={link.name} 
          icon={link.icon} 
          path={link.path}
          isActive={location.pathname.startsWith(link.path)}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

/**
 * Mobile navigation component
 * @param {FlexProps} props - Component props
 */
const MobileNav = ({ onOpen, ...rest }) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <Icon
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        as={FiMenu}
        w={5}
        h={5}
      />

      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
      >
        GPU Monitor
      </Text>
    </Flex>
  );
};

/**
 * Navigation item component
 * @param {Object} props - Component props
 * @param {IconType} props.icon - Icon component
 * @param {string} props.path - URL path
 * @param {boolean} props.isActive - Whether the item is active
 * @param {React.ReactNode} props.children - Child components
 */
const NavItem = ({ icon, path, isActive, children, ...rest }) => {
  return (
    <Link
      as={RouterLink}
      to={path}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'blue.400' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{
          bg: 'blue.400',
          color: 'white',
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'white',
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

/**
 * Sidebar container component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const SidebarContainer = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Sidebar
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
};

export default Sidebar;
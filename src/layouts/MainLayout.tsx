import { useState, type ReactElement, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import {
  Box,
  Drawer,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
  VStack,
  chakra,
} from '@chakra-ui/react';
import {
  FiCheckSquare,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

import { useAuth } from '../hooks/useAuth';

interface MainLayoutProps {
  title?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

interface NavItem {
  label: string;
  to: string;
  icon: IconType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: FiGrid },
  { label: 'Alunos', to: '/alunos', icon: FiUsers },
  { label: 'Turmas', to: '/turmas', icon: FiLayers },
  { label: 'Avaliações', to: '/turmas', icon: FiCheckSquare },
];

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }): ReactElement => {
  const location = useLocation();

  return (
    <VStack
      as="nav"
      gap={4}
      align="stretch"
      px={6}
      py={8}
      w="64"
      bg="white"
      borderRightWidth="1px"
      borderColor="gray.100"
      _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
    >
      <chakra.h1 fontSize="xl" fontWeight="bold">
        Portal do Professor
      </chakra.h1>
      <Stack as="ul" listStyleType="none" m={0} p={0} gap={1}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          return (
            <chakra.li key={item.to}>
              <NavLink to={item.to} onClick={onNavigate} style={{ textDecoration: 'none' }}>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={3}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  fontWeight="medium"
                  color={isActive ? 'white' : 'fg.muted'}
                  bg={isActive ? 'brand.500' : 'transparent'}
                  _hover={
                    isActive
                      ? { bg: 'brand.600', color: 'white' }
                      : { bg: 'gray.100', color: 'fg.default' }
                  }
                  _dark={
                    isActive
                      ? { bg: 'brand.400', color: 'gray.900' }
                      : { color: 'fg.muted', _hover: { bg: 'gray.800', color: 'fg.default' } }
                  }
                >
                  <chakra.span fontSize="lg">
                    <item.icon />
                  </chakra.span>
                  <Text>{item.label}</Text>
                </Box>
              </NavLink>
            </chakra.li>
          );
        })}
      </Stack>
    </VStack>
  );
};

export const MainLayout = ({ title, actions, children }: MainLayoutProps): ReactElement => {
  const { user, logout } = useAuth();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  const handleOpenMobileNav = (): void => {
    setMobileNavOpen(true);
  };

  const handleMobileNavChange = ({ open }: { open: boolean }): void => {
    setMobileNavOpen(open);
  };

  return (
    <Flex minH="100vh">
      <Box display={{ base: 'none', lg: 'block' }} flexShrink={0}>
        <Sidebar />
      </Box>

      <Flex flex="1" direction="column">
        <Flex
          as="header"
          align="center"
          justify="space-between"
          px={{ base: 4, md: 8 }}
          py={4}
          borderBottomWidth="1px"
          borderColor="gray.100"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <HStack gap={4}>
            <IconButton
              aria-label="Abrir menu"
              variant="ghost"
              display={{ base: 'inline-flex', lg: 'none' }}
              onClick={handleOpenMobileNav}
            >
              <FiMenu />
            </IconButton>
            <Text fontSize="lg" fontWeight="semibold">
              {title ?? 'Painel'}
            </Text>
          </HStack>

          <HStack gap={6} alignItems="center">
            {actions}
            <VStack gap={0} alignItems="flex-end">
              <Text fontWeight="medium">{user?.name}</Text>
              <Text fontSize="sm" color="fg.muted">
                {user?.email}
              </Text>
            </VStack>
            <IconButton aria-label="Encerrar sessão" variant="outline" onClick={() => void logout()}>
              <FiLogOut />
            </IconButton>
          </HStack>
        </Flex>

        <Box
          as="main"
          flex="1"
          px={{ base: 4, md: 8 }}
          py={{ base: 6, md: 10 }}
          bg="gray.50"
          _dark={{ bg: 'gray.900' }}
        >
          {children ?? <Outlet />}
        </Box>
      </Flex>

      <Drawer.Root open={isMobileNavOpen} onOpenChange={handleMobileNavChange} placement="start">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="xs" p={0} bg="white" _dark={{ bg: 'gray.900' }}>
            <Drawer.CloseTrigger position="absolute" top={2} right={2} />
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Flex>
  );
};

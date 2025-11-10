import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
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
  { label: 'Avaliações', to: '/avaliacoes', icon: FiCheckSquare },
];

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }): ReactElement => {
  const location = useLocation();

  return (
    <VStack
      as="nav"
      gap={6}
      align="stretch"
  px={6}
  py={8}
  w="68"
  bg="gray.900"
      color="gray.200"
      boxShadow="lg"
  minH="100vh"
  borderTopRightRadius="3xl"
  borderBottomRightRadius="3xl"
    >
      <chakra.h1 fontSize="xl" fontWeight="bold" color="white">
        Portal do Professor
      </chakra.h1>
      <Stack as="ul" listStyleType="none" m={0} p={0} gap={1}>
        {navItems.map((item) => {
          const pathname = location.pathname;
          const isEvaluationsPath = pathname.includes('/avaliacoes');

          let isActive = false;
          if (item.to === '/avaliacoes') {
            isActive = isEvaluationsPath;
          } else if (item.to === '/turmas') {
            isActive = pathname === '/turmas' || (pathname.startsWith('/turmas') && !isEvaluationsPath);
          } else {
            isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
          }

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
                  color={isActive ? 'white' : 'gray.200'}
                  bg={isActive ? 'brand.500' : 'transparent'}
                  _hover={{ bg: isActive ? 'brand.500' : 'gray.700', color: 'white' }}
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
  const location = useLocation();

  const resolvedTitle = useMemo(() => {
    if (title) {
      return title;
    }

    const path = location.pathname;

    if (path.startsWith('/dashboard')) {
      return 'Visão geral';
    }

    if (path.startsWith('/alunos')) {
      return 'Gestão de alunos';
    }

    if (path.startsWith('/turmas') && path.includes('/avaliacoes')) {
      return 'Configurar avaliações';
    }

    if (path.startsWith('/turmas')) {
      return 'Gestão de turmas';
    }

    if (path.startsWith('/avaliacoes')) {
      return 'Avaliações';
    }

    return 'Portal do Professor';
  }, [location.pathname, title]);

  const handleOpenMobileNav = (): void => {
    setMobileNavOpen(true);
  };

  const handleMobileNavChange = ({ open }: { open: boolean }): void => {
    setMobileNavOpen(open);
  };

  return (
    <Flex
      minH="100vh"
      bgGradient="linear(to-br, brand.50, transparent)"
      backdropFilter="blur(6px)"
    >
      <Box display={{ base: 'none', lg: 'block' }} flexShrink={0}>
        <Sidebar />
      </Box>

      <Flex flex="1" direction="column">
        <Flex
          as="header"
          align="center"
          justify="space-between"
          px={{ base: 4, md: 10 }}
          py={4}
          borderBottomWidth="1px"
          borderColor="gray.100"
          bg="white"
          boxShadow="sm"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <HStack gap={4}>
            <IconButton
              aria-label="Abrir menu"
              variant="solid"
              colorPalette="brand"
              display={{ base: 'inline-flex', lg: 'none' }}
              onClick={handleOpenMobileNav}
            >
              <FiMenu />
            </IconButton>
            <Text fontSize="lg" fontWeight="semibold" color="fg.default">
              {resolvedTitle}
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
            <IconButton
              aria-label="Encerrar sessão"
              variant="solid"
              colorPalette="brand"
              onClick={() => void logout()}
            >
              <FiLogOut />
            </IconButton>
          </HStack>
        </Flex>

        <Box as="main" flex="1" px={{ base: 4, md: 10 }} py={{ base: 6, md: 10 }}>
          <Box
            maxW="1200px"
            mx="auto"
            bg="bg.surface"
            borderRadius="2xl"
            boxShadow="xl"
            px={{ base: 4, md: 10 }}
            py={{ base: 6, md: 10 }}
            borderWidth="1px"
            borderColor="gray.100"
          >
            {children ?? <Outlet />}
          </Box>
        </Box>
      </Flex>

      <Drawer.Root open={isMobileNavOpen} onOpenChange={handleMobileNavChange} placement="start">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="xs" p={0} bg="gray.900" color="white">
            <Drawer.CloseTrigger position="absolute" top={2} right={2} color="whiteAlpha.900" />
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Flex>
  );
};

import type { ReactElement, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { Box, Flex, HStack, IconButton, Text, VStack, chakra } from '@chakra-ui/react';
import { FiLogOut, FiMenu } from 'react-icons/fi';

import { useAuth } from '../hooks/useAuth';

interface MainLayoutProps {
  title?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

const Sidebar = (): ReactElement => {
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
      {/* Links de navegação serão adicionados posteriormente */}
    </VStack>
  );
};

export const MainLayout = ({ title, actions, children }: MainLayoutProps): ReactElement => {
  const { user, logout } = useAuth();

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
    </Flex>
  );
};

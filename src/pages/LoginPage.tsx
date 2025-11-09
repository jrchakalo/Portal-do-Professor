import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  chakra,
  useToast,
} from '@chakra-ui/react';
import type { FormEvent, ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

interface LoginFormState {
  email: string;
  password: string;
}

const emailPattern = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

const createInitialState = (): LoginFormState => ({
  email: '',
  password: '',
});

const LoginPage = (): ReactElement => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, isAuthenticated, isLoading, error, resetError } = useAuth();
  const [formState, setFormState] = useState<LoginFormState>(createInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = useMemo(() => {
    const fallback = '/dashboard';
    if (location.state && typeof location.state === 'object') {
      const state = location.state as { from?: { pathname?: string } };
      return state.from?.pathname ?? fallback;
    }
    return fallback;
  }, [location.state]);

  const isEmailInvalid = formState.email.length > 0 && !emailPattern.test(formState.email);
  const isPasswordInvalid = formState.password.length > 0 && formState.password.length < 6;
  const isSubmitDisabled =
    isSubmitting || isLoading || !formState.email || !formState.password || isEmailInvalid;

  const handleChange = useCallback(
    (key: keyof LoginFormState) =>
      (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (error) {
          resetError();
        }
        setFormState((prev) => ({ ...prev, [key]: event.target.value }));
      },
    [error, resetError],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      if (isSubmitDisabled) {
        return;
      }

      setIsSubmitting(true);
      try {
        await login({
          email: formState.email,
          password: formState.password,
        });
        toast({
          title: 'Login realizado com sucesso!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setFormState(createInitialState());
        navigate(redirectPath, { replace: true });
      } catch {
        toast({
          title: 'Não foi possível autenticar',
          description: 'Verifique suas credenciais e tente novamente.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.email, formState.password, isSubmitDisabled, login, toast, navigate, redirectPath],
  );

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <Container maxW="lg" py={{ base: 12, md: 24 }}>
      <Stack spacing={10} align="center">
        <Stack spacing={3} textAlign="center">
          <Heading size="2xl">Portal do Professor</Heading>
          <Text color="fg.muted">Acesse o painel para gerenciar suas turmas e avaliações.</Text>
        </Stack>

        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          _dark={{ bg: 'gray.800' }}
          shadow="md"
          borderRadius="xl"
          w="full"
          p={{ base: 6, md: 10 }}
        >
          <Stack spacing={6}>
            <Stack spacing={4}>
              <FormControl isRequired isInvalid={isEmailInvalid}>
                <FormLabel>E-mail</FormLabel>
                <Input
                  type="email"
                  value={formState.email}
                  onChange={handleChange('email')}
                  placeholder="professora@portal.com"
                  autoComplete="email"
                  size="lg"
                />
                <FormErrorMessage>Informe um e-mail válido.</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={isPasswordInvalid}>
                <FormLabel>Senha</FormLabel>
                <Input
                  type="password"
                  value={formState.password}
                  onChange={handleChange('password')}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  size="lg"
                />
                <FormErrorMessage>A senha deve conter pelo menos 6 caracteres.</FormErrorMessage>
              </FormControl>
            </Stack>

            {error ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error.message}
              </Alert>
            ) : null}

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              isLoading={isSubmitting}
              isDisabled={isSubmitDisabled}
            >
              Entrar
            </Button>
          </Stack>
        </Box>

        <Text fontSize="sm" color="fg.muted">
          Dica: utilize <chakra.span fontWeight="semibold">professora@portal.com</chakra.span> com
          a senha <chakra.span fontWeight="semibold">senha123</chakra.span> para acessar o sistema.
        </Text>
      </Stack>
    </Container>
  );
};

export default LoginPage;

import { Alert, Button, Container, Field, Heading, Input, Stack, Text, chakra } from '@chakra-ui/react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
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
      (event: ChangeEvent<HTMLInputElement>): void => {
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
        setFormState(createInitialState());
        navigate(redirectPath, { replace: true });
      } catch {
        // feedback visual é tratado pelo alerta exibido abaixo
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.email, formState.password, isSubmitDisabled, login, navigate, redirectPath],
  );

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <Container maxW="lg" py={{ base: 12, md: 24 }}>
      <Stack gap={10} alignItems="center">
        <Stack gap={3} textAlign="center">
          <Heading size="2xl">Portal do Professor</Heading>
          <Text color="fg.muted">Acesse o painel para gerenciar suas turmas e avaliações.</Text>
        </Stack>

        <chakra.form
          onSubmit={handleSubmit}
          bg="white"
          _dark={{ bg: 'gray.800' }}
          shadow="md"
          borderRadius="xl"
          w="full"
          p={{ base: 6, md: 10 }}
        >
          <Stack gap={6}>
            <Stack gap={4}>
              <Field.Root required invalid={isEmailInvalid}>
                <Field.Label>E-mail</Field.Label>
                <Input
                  type="email"
                  value={formState.email}
                  onChange={handleChange('email')}
                  placeholder="professora@portal.com"
                  autoComplete="email"
                  size="lg"
                />
                {isEmailInvalid ? <Field.ErrorText>Informe um e-mail válido.</Field.ErrorText> : null}
              </Field.Root>

              <Field.Root required invalid={isPasswordInvalid}>
                <Field.Label>Senha</Field.Label>
                <Input
                  type="password"
                  value={formState.password}
                  onChange={handleChange('password')}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  size="lg"
                />
                {isPasswordInvalid ? (
                  <Field.ErrorText>A senha deve conter pelo menos 6 caracteres.</Field.ErrorText>
                ) : null}
              </Field.Root>
            </Stack>

            {error ? (
              <Alert.Root status="error" borderRadius="md">
                <Alert.Indicator />
                <Alert.Content>{error.message}</Alert.Content>
              </Alert.Root>
            ) : null}

            <Button
              type="submit"
              colorPalette="brand"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitDisabled}
            >
              Entrar
            </Button>
          </Stack>
  </chakra.form>

        <Text fontSize="sm" color="fg.muted">
          Dica: utilize <chakra.span fontWeight="semibold">professora@portal.com</chakra.span> com
          a senha <chakra.span fontWeight="semibold">senha123</chakra.span> para acessar o sistema.
        </Text>
      </Stack>
    </Container>
  );
};

export default LoginPage;

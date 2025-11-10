import {
  Alert,
  Button,
  Card,
  Field,
  HStack,
  Heading,
  NativeSelect,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { EvaluationCriteriaForm } from '../components/evaluations/EvaluationCriteriaForm';
import { UpcomingEvaluationsList } from '../components/evaluations/UpcomingEvaluationsList';
import { OverviewStatCard } from '../components/dashboard/OverviewStatCard';
import { useEvaluations } from '../hooks/useEvaluations';
import type { EvaluationCriterionInput } from '../types';

const EvaluationsPage = (): ReactElement => {
  const {
    classes,
    configs,
    upcomingEvaluations,
    isLoading,
    isMutating,
    error,
    refresh,
    updateConfig,
    resetError,
  } = useEvaluations();

  const navigate = useNavigate();
  const { id: classIdParam } = useParams<{ id?: string }>();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  useEffect(() => {
    if (classes.length === 0) {
      if (selectedClassId !== null) {
        setSelectedClassId(null);
        setFormResetKey((key) => key + 1);
      }
      return;
    }

    if (classIdParam && classes.some((classRoom) => classRoom.id === classIdParam)) {
      if (selectedClassId !== classIdParam) {
        setSelectedClassId(classIdParam);
        setFormResetKey((key) => key + 1);
      }
      return;
    }

    const selectedExists = selectedClassId ? classes.some((classRoom) => classRoom.id === selectedClassId) : false;
    if (!selectedExists) {
      setSelectedClassId(classes[0].id);
      setFormResetKey((key) => key + 1);
    }
  }, [classIdParam, classes, selectedClassId]);

  const selectedConfig = useMemo(() => {
    if (!selectedClassId) {
      return undefined;
    }
    return configs[selectedClassId];
  }, [configs, selectedClassId]);

  const selectedCriteria = selectedConfig?.criteria ?? [];
  const lastUpdatedAt = selectedConfig?.updatedAt ? new Date(selectedConfig.updatedAt) : null;

  const configuredClassesCount = useMemo(() => {
    return Object.values(configs).filter((config) => config.criteria.length > 0).length;
  }, [configs]);

  const totalCriteria = useMemo(() => {
    return Object.values(configs).reduce((sum, config) => sum + config.criteria.length, 0);
  }, [configs]);

  const mostRecentUpdate = useMemo(() => {
    const timestamps = Object.values(configs)
      .filter((config) => config.criteria.length > 0)
      .map((config) => new Date(config.updatedAt).getTime());

    if (timestamps.length === 0) {
      return null;
    }

    return new Date(Math.max(...timestamps));
  }, [configs]);

  const formattedRecentUpdate = mostRecentUpdate
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(mostRecentUpdate)
    : 'Sem atualizações';

  const handleSelectClass = useCallback(
    (event: ChangeEvent<HTMLSelectElement>): void => {
      const value = event.target.value;
      const nextClassId = value === '' ? null : value;

      if (nextClassId === selectedClassId) {
        return;
      }

      setSelectedClassId(nextClassId);
      setFormResetKey((key) => key + 1);
      resetError();
      setSuccessMessage(null);

      if (nextClassId) {
        if (classIdParam !== nextClassId) {
          navigate(`/turmas/${nextClassId}/avaliacoes`, { replace: true });
        }
      } else if (classIdParam) {
        navigate('/avaliacoes', { replace: true });
      }
    },
    [classIdParam, navigate, resetError, selectedClassId],
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    resetError();
    try {
      await refresh();
    } catch {
      // feedback exibido via alerta
    }
    setSuccessMessage(null);
  }, [refresh, resetError]);

  const handleSubmitCriteria = useCallback(
    async (criteria: EvaluationCriterionInput[]): Promise<void> => {
      if (!selectedClassId) {
        return;
      }

      setIsSaving(true);
      try {
        await updateConfig(selectedClassId, { criteria });
        setSuccessMessage('Critérios atualizados com sucesso.');
      } catch {
        setSuccessMessage(null);
      } finally {
        setIsSaving(false);
      }
    },
    [selectedClassId, updateConfig],
  );

  const handleCancelEdit = useCallback((): void => {
    setFormResetKey((key) => key + 1);
    setSuccessMessage(null);
    resetError();
  }, [resetError]);

  const isClassListEmpty = !isLoading && classes.length === 0;

  return (
    <Stack gap={6}>
      <Stack direction={{ base: 'column', xl: 'row' }} justify="space-between" align={{ base: 'flex-start', xl: 'center' }} gap={4}>
        <Stack gap={1}>
          <Heading size="lg">Avaliações</Heading>
          <Text color="fg.muted">Configure os critérios de avaliação de cada turma e acompanhe o calendário.</Text>
        </Stack>
        <HStack gap={3} align="center">
          <Button
            variant="outline"
            colorPalette="brand"
            gap={2}
            onClick={() => void handleRefresh()}
            disabled={isLoading || isMutating || isSaving}
          >
            <FiRefreshCw />
            <Text as="span">Atualizar</Text>
          </Button>
        </HStack>
      </Stack>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`summary-skeleton-${index}`} height="24" borderRadius="lg" />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
          <OverviewStatCard label="Turmas configuradas" value={configuredClassesCount} helperText={`de ${classes.length} turmas`} />
          <OverviewStatCard label="Critérios cadastrados" value={totalCriteria} helperText="soma de todos os critérios" />
          <OverviewStatCard label="Avaliações agendadas" value={upcomingEvaluations.length} helperText="nos próximos dias" />
          <OverviewStatCard label="Última atualização" value={formattedRecentUpdate} />
        </SimpleGrid>
      )}

      {error ? (
        <Alert.Root status="error" borderRadius="md">
          <Alert.Indicator />
          <Alert.Content>{error.message}</Alert.Content>
        </Alert.Root>
      ) : null}

      {successMessage ? (
        <Alert.Root status="success" borderRadius="md">
          <Alert.Indicator />
          <Alert.Content>{successMessage}</Alert.Content>
        </Alert.Root>
      ) : null}

      {isClassListEmpty ? (
        <Card.Root>
          <Card.Body>
            <Text>Nenhuma turma cadastrada. Cadastre turmas para configurar avaliações.</Text>
          </Card.Body>
        </Card.Root>
      ) : (
        <Stack direction={{ base: 'column', xl: 'row' }} gap={6} align="flex-start">
          <Card.Root flex="1" w="full">
            <Card.Header>
              <Stack gap={3} w="full">
                <Field.Root>
                  <Field.Label>Turma</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field value={selectedClassId ?? ''} onChange={handleSelectClass}>
                      <option value="" disabled>
                        Selecione uma turma
                      </option>
                      {classes.map((classRoom) => (
                        <option key={classRoom.id} value={classRoom.id}>
                          {classRoom.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
                {lastUpdatedAt ? (
                  <Text fontSize="sm" color="fg.muted">
                    Última atualização em{' '}
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(lastUpdatedAt)}
                  </Text>
                ) : null}
              </Stack>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <Stack gap={4}>
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={`criteria-skeleton-${index}`} height="32" borderRadius="md" />
                  ))}
                </Stack>
              ) : selectedClassId ? (
                <EvaluationCriteriaForm
                  key={`${selectedClassId}-${formResetKey}`}
                  defaultValues={selectedCriteria.map((criterion) => ({ ...criterion }))}
                  onSubmit={handleSubmitCriteria}
                  isSubmitting={isMutating || isSaving}
                  onCancel={handleCancelEdit}
                  cancelLabel="Descartar alterações"
                  submitLabel="Salvar critérios"
                />
              ) : (
                <Text color="fg.muted">Selecione uma turma para configurar os critérios.</Text>
              )}
            </Card.Body>
          </Card.Root>

          <Stack flexShrink={0} w={{ base: 'full', xl: 'sm' }} gap={4}>
            <Heading size="md">Próximas avaliações</Heading>
            {isLoading ? (
              <Stack gap={3}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`upcoming-skeleton-${index}`} height="24" borderRadius="lg" />
                ))}
              </Stack>
            ) : (
              <UpcomingEvaluationsList evaluations={upcomingEvaluations} classes={classes} />
            )}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

export default EvaluationsPage;

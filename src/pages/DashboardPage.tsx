import {
  Box,
  Card,
  Flex,
  Heading,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useMemo, type ReactElement } from 'react';

import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { formatScheduledDate } from '../utils/date';

const DashboardPage = (): ReactElement => {
  const { metrics, evaluations, classSummaries, nextEvaluation, isLoading } = useDashboardOverview();

  const evaluationItems = useMemo(() => {
    if (isLoading) {
      return [
        <Text key="loading" color="fg.muted">
          Carregando avaliações...
        </Text>,
      ];
    }

    if (evaluations.length === 0) {
      return [
        <Text key="empty" color="fg.muted">
          Nenhuma avaliação agendada.
        </Text>,
      ];
    }

    return evaluations.map((evaluation) => {
      return (
        <Box key={evaluation.id} py={2} borderBottomWidth="1px" borderColor="gray.100" _last={{ borderBottomWidth: 0 }}>
          <Heading size="sm">{evaluation.title}</Heading>
          <Text fontSize="sm" color="fg.muted">
            Turma:{' '}
            <Text as="span" fontWeight="medium" color="fg.default">
              {evaluation.className}
            </Text>
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Agendado para:{' '}
            <Text as="span" fontWeight="medium" color="fg.default">
              {formatScheduledDate(evaluation.scheduledAt)}
            </Text>
          </Text>
        </Box>
      );
    });
  }, [evaluations, isLoading]);

  const upcomingEvaluationDate = nextEvaluation ? formatScheduledDate(nextEvaluation.scheduledAt) : null;

  return (
    <Stack gap={6}>
      <Heading size="lg">Visão Geral</Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Card.Root>
          <Card.Header>
            <Heading size="sm" color="fg.muted">
              Alunos ativos
            </Heading>
          </Card.Header>
          <Card.Body>
            <Text fontSize="3xl" fontWeight="bold">
              {metrics.activeStudents}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Total de {metrics.students} alunos cadastrados
            </Text>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="sm" color="fg.muted">
              Turmas
            </Heading>
          </Card.Header>
          <Card.Body>
            <Text fontSize="3xl" fontWeight="bold">
              {metrics.classes}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Turmas em acompanhamento
            </Text>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="sm" color="fg.muted">
              Próxima avaliação
            </Heading>
          </Card.Header>
          <Card.Body>
            <Text fontSize="lg" fontWeight="medium">
              {nextEvaluation?.title ?? 'Nenhuma avaliação agendada'}
            </Text>
            {nextEvaluation ? (
              <Text fontSize="sm" color="fg.muted">
                {nextEvaluation.className} · {upcomingEvaluationDate}
              </Text>
            ) : null}
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <Card.Root>
          <Card.Header>
            <Heading size="md">Próximas avaliações</Heading>
          </Card.Header>
          <Card.Body>{evaluationItems}</Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="md">Capacidade das turmas</Heading>
          </Card.Header>
          <Card.Body>
            {isLoading ? (
              <Text color="fg.muted">Carregando dados...</Text>
            ) : classSummaries.length === 0 ? (
              <Text color="fg.muted">Sem turmas cadastradas.</Text>
            ) : (
              <Stack gap={4}>
                {classSummaries.map((classSummary) => (
                  <Box
                    key={classSummary.id}
                    pb={3}
                    borderBottomWidth="1px"
                    borderColor="gray.100"
                    _last={{ borderBottomWidth: 0, pb: 0 }}
                  >
                    <Flex align="center" justify="space-between" mb={1} gap={4}>
                      <Heading size="sm">{classSummary.name}</Heading>
                      <Text fontSize="sm" color="fg.muted">
                        {classSummary.totalStudents} / {classSummary.capacity} alunos
                      </Text>
                    </Flex>
                    <Progress.Root value={classSummary.occupancyPercent} max={100}>
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      {classSummary.activeCount} ativos · {classSummary.inactiveCount} inativos
                    </Text>
                  </Box>
                ))}
              </Stack>
            )}
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </Stack>
  );
};

export default DashboardPage;

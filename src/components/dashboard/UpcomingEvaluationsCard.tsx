import { Box, Card, Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import type { DashboardEvaluation } from '../../hooks/useDashboardOverview';
import { formatScheduledDate } from '../../utils/date';

interface UpcomingEvaluationsCardProps {
  evaluations: DashboardEvaluation[];
  isLoading: boolean;
}

export const UpcomingEvaluationsCard = ({
  evaluations,
  isLoading,
}: UpcomingEvaluationsCardProps): ReactElement => {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="md">Próximas avaliações</Heading>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <Text color="fg.muted">Carregando avaliações...</Text>
        ) : evaluations.length === 0 ? (
          <Text color="fg.muted">Nenhuma avaliação agendada.</Text>
        ) : (
          <Stack gap={2}>
            {evaluations.map((evaluation) => (
              <Box
                key={evaluation.id}
                py={2}
                borderBottomWidth="1px"
                borderColor="gray.100"
                _last={{ borderBottomWidth: 0 }}
              >
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
            ))}
          </Stack>
        )}
      </Card.Body>
    </Card.Root>
  );
};

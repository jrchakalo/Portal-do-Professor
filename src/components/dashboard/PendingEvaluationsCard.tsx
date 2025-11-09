import { Card, Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import type { PendingEvaluationReminder } from '../../hooks/useDashboardOverview';
import { formatDate } from '../../utils/date';

interface PendingEvaluationsCardProps {
  pendingClasses: PendingEvaluationReminder[];
  isLoading: boolean;
}

export const PendingEvaluationsCard = ({
  pendingClasses,
  isLoading,
}: PendingEvaluationsCardProps): ReactElement => {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="md">Turmas sem avaliações próximas</Heading>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <Text color="fg.muted">Carregando dados...</Text>
        ) : pendingClasses.length === 0 ? (
          <Text color="fg.muted">Todas as turmas possuem avaliações agendadas.</Text>
        ) : (
          <Stack gap={3}>
            {pendingClasses.map((classReminder) => (
              <Stack key={classReminder.id} gap={1} borderBottomWidth="1px" borderColor="gray.100" _last={{ borderBottomWidth: 0 }} pb={2}>
                <Heading size="sm">{classReminder.name}</Heading>
                <Text fontSize="sm" color="fg.muted">
                  {classReminder.studentCount} alunos · Atualizada em {formatDate(classReminder.lastUpdatedAt)}
                </Text>
              </Stack>
            ))}
          </Stack>
        )}
      </Card.Body>
    </Card.Root>
  );
};

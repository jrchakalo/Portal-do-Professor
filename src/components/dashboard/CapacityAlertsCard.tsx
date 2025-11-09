import { Card, Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import type { CapacityAlert } from '../../hooks/useDashboardOverview';

interface CapacityAlertsCardProps {
  alerts: CapacityAlert[];
  isLoading: boolean;
}

export const CapacityAlertsCard = ({ alerts, isLoading }: CapacityAlertsCardProps): ReactElement => {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="md">Turmas em capacidade crítica</Heading>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <Text color="fg.muted">Carregando dados...</Text>
        ) : alerts.length === 0 ? (
          <Text color="fg.muted">Nenhuma turma próxima da capacidade máxima.</Text>
        ) : (
          <Stack gap={3}>
            {alerts.map((alert) => (
              <Stack
                key={alert.id}
                gap={1}
                borderBottomWidth="1px"
                borderColor="gray.100"
                _last={{ borderBottomWidth: 0 }}
                pb={2}
              >
                <Heading size="sm">{alert.name}</Heading>
                <Text fontSize="sm" color="fg.muted">
                  {alert.totalStudents} / {alert.capacity} alunos · {alert.occupancyPercent}% de ocupação
                </Text>
              </Stack>
            ))}
          </Stack>
        )}
      </Card.Body>
    </Card.Root>
  );
};

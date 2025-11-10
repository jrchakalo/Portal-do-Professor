import { Card, Flex, Heading, Progress, Stack, Text } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import type { StudentStatusSummary } from '../../hooks/useDashboardOverview';

interface StudentStatusCardProps {
  status: StudentStatusSummary;
  isLoading: boolean;
}

export const StudentStatusCard = ({ status, isLoading }: StudentStatusCardProps): ReactElement => {
  const activePercent = status.total > 0 ? Math.round((status.active / status.total) * 100) : 0;

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="md">Engajamento dos alunos</Heading>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <Text color="fg.muted">Carregando dados...</Text>
        ) : status.total === 0 ? (
          <Text color="fg.muted">Nenhum aluno cadastrado no momento.</Text>
        ) : (
          <Stack gap={3}>
            <Flex justify="space-between" align="center">
              <Text fontWeight="medium">Ativos</Text>
              <Text color="fg.muted">{status.active}</Text>
            </Flex>
            <Progress.Root value={activePercent} max={100}>
              <Progress.Track bg="gray.100">
                <Progress.Range bgGradient="linear(to-r, #ef4444 0%, #facc15 50%, #16a34a 100%)" />
              </Progress.Track>
            </Progress.Root>
            <Flex justify="space-between" fontSize="sm" color="fg.muted">
              <Text>{activePercent}% engajados</Text>
              <Text>{status.inactive} inativos</Text>
            </Flex>
          </Stack>
        )}
      </Card.Body>
    </Card.Root>
  );
};

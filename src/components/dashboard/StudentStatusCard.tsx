import { Card, Flex, Heading, Progress, Stack, Text } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import type { StudentStatusSummary } from '../../hooks/useDashboardOverview';

interface StudentStatusCardProps {
  status: StudentStatusSummary;
  isLoading: boolean;
}

const getEngagementColor = (percent: number) => {
  if (percent < 40) return "#ef4444"; // Vermelho (baixo engajamento)
  if (percent < 70) return "#facc15"; // Amarelo (mediano)
  return "#16a34a"; // Verde (bom)
};

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
              <Progress.Track bg="gray.100" borderRadius="full" overflow="hidden">
                <Progress.Range bg={getEngagementColor(activePercent)} />
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

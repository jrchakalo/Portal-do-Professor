import { Box, Card, Flex, Heading, Progress, Stack, Text } from '@chakra-ui/react';
import type { CSSProperties, ReactElement } from 'react';

import type { ClassSummary } from '../../hooks/useDashboardOverview';

interface ClassCapacityCardProps {
  classes: ClassSummary[];
  isLoading: boolean;
}

const OCCUPANCY_GRADIENT = 'linear-gradient(90deg, #3b82f6 0%, #facc15 50%, #ef4444 100%)';
const occupancyGradientStyle = {
  '--progress-range-bg': OCCUPANCY_GRADIENT,
} as CSSProperties;

export const ClassCapacityCard = ({ classes, isLoading }: ClassCapacityCardProps): ReactElement => {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="md">Capacidade das turmas</Heading>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <Text color="fg.muted">Carregando dados...</Text>
        ) : classes.length === 0 ? (
          <Text color="fg.muted">Sem turmas cadastradas.</Text>
        ) : (
          <Stack gap={4}>
            {classes.map((classSummary) => (
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
                  <Progress.Track bg="gray.100">
                    <Progress.Range style={occupancyGradientStyle} />
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
  );
};

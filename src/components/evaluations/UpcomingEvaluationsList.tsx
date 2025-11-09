import { Card, HStack, Stack, Text } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import type { ClassRoom, UpcomingEvaluation } from '../../types';

interface UpcomingEvaluationsListProps {
  evaluations: UpcomingEvaluation[];
  classes: ClassRoom[];
}

const formatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const UpcomingEvaluationsList = ({
  evaluations,
  classes,
}: UpcomingEvaluationsListProps): ReactElement => {
  const classNameById = classes.reduce<Record<string, string>>((acc, classRoom) => {
    acc[classRoom.id] = classRoom.name;
    return acc;
  }, {});

  if (evaluations.length === 0) {
    return (
      <Card.Root>
        <Card.Body>
          <Text color="fg.muted">Nenhuma avaliação agendada para os próximos dias.</Text>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Stack gap={3}>
      {evaluations.map((evaluation) => (
        <Card.Root key={evaluation.id} borderWidth="1px" borderRadius="lg">
          <Card.Body>
            <Stack gap={2}>
              <Text fontWeight="semibold">{evaluation.title}</Text>
              <HStack justify="space-between" align="flex-start">
                <Stack gap={1}>
                  <Text fontSize="sm" color="fg.muted">
                    Turma
                  </Text>
                  <Text>{classNameById[evaluation.classId] ?? 'Turma não encontrada'}</Text>
                </Stack>
                <Stack gap={1} align="flex-end">
                  <Text fontSize="sm" color="fg.muted">
                    Agendada para
                  </Text>
                  <Text>{formatter.format(new Date(evaluation.scheduledAt))}</Text>
                </Stack>
              </HStack>
            </Stack>
          </Card.Body>
        </Card.Root>
      ))}
    </Stack>
  );
};

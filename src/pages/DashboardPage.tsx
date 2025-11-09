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
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import type { ClassRoom, Student, UpcomingEvaluation } from '../types';
import { mockServer } from '../services/mockServer';

interface OverviewMetrics {
  students: number;
  classes: number;
  activeStudents: number;
}

const DashboardPage = (): ReactElement => {
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    students: 0,
    classes: 0,
    activeStudents: 0,
  });
  const [evaluations, setEvaluations] = useState<UpcomingEvaluation[]>([]);
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const snapshot = mockServer.snapshot();
    const activeStudentsCount = snapshot.students.filter((student) => student.status === 'active').length;

    setMetrics({
      students: snapshot.students.length,
      classes: snapshot.classes.length,
      activeStudents: activeStudentsCount,
    });

    setEvaluations(snapshot.upcomingEvaluations);
    setClassrooms(snapshot.classes);
    setStudents(snapshot.students);
  }, []);

  const classroomsById = useMemo(() => {
    return classrooms.reduce<Record<string, ClassRoom>>((acc, classRoom) => {
      acc[classRoom.id] = classRoom;
      return acc;
    }, {});
  }, [classrooms]);

  const studentsByClass = useMemo(() => {
    return students.reduce<Record<string, Student[]>>((acc, student) => {
      if (!student.classId) {
        return acc;
      }

      if (!acc[student.classId]) {
        acc[student.classId] = [];
      }

      acc[student.classId].push(student);
      return acc;
    }, {});
  }, [students]);

  const evaluationItems = useMemo(() => {
    if (evaluations.length === 0) {
      return [
        <Text key="empty" color="fg.muted">
          Nenhuma avaliação agendada.
        </Text>,
      ];
    }

    return evaluations.map((evaluation) => {
      const classRoom = classroomsById[evaluation.classId];

      return (
        <Box key={evaluation.id} py={2} borderBottomWidth="1px" borderColor="gray.100" _last={{ borderBottomWidth: 0 }}>
          <Heading size="sm">{evaluation.title}</Heading>
          <Text fontSize="sm" color="fg.muted">
            Turma:{' '}
            <Text as="span" fontWeight="medium" color="fg.default">
              {classRoom?.name ?? 'Turma desconhecida'}
            </Text>
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Agendado para:{' '}
            <Text as="span" fontWeight="medium" color="fg.default">
              {new Date(evaluation.scheduledAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Text>
        </Box>
      );
    });
  }, [classroomsById, evaluations]);

  const nextEvaluation = evaluations[0];

  const classSummaries = useMemo(() => {
    return classrooms.map((classRoom) => {
      const classStudents = studentsByClass[classRoom.id] ?? [];
      const activeCount = classStudents.filter((student) => student.status === 'active').length;
      const inactiveCount = classStudents.length - activeCount;
      const totalStudents = classStudents.length;
      const occupancyPercent =
        classRoom.capacity > 0
          ? Math.min(100, Math.round((totalStudents / classRoom.capacity) * 100))
          : 0;

      return {
        id: classRoom.id,
        name: classRoom.name,
        capacity: classRoom.capacity,
        totalStudents,
        activeCount,
        inactiveCount,
        occupancyPercent,
      };
    });
  }, [classrooms, studentsByClass]);

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
                {new Date(nextEvaluation.scheduledAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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
            {classSummaries.length === 0 ? (
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

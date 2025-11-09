import { Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { useMemo, type ReactElement } from 'react';

import { ClassCapacityCard } from '../components/dashboard/ClassCapacityCard';
import { OverviewStatCard } from '../components/dashboard/OverviewStatCard';
import { UpcomingEvaluationsCard } from '../components/dashboard/UpcomingEvaluationsCard';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { formatScheduledDate } from '../utils/date';

const DashboardPage = (): ReactElement => {
  const { metrics, evaluations, classSummaries, nextEvaluation, isLoading } = useDashboardOverview();

  const nextEvaluationHelper = useMemo(() => {
    if (!nextEvaluation) {
      return 'Nenhuma avaliação agendada';
    }

    return `${nextEvaluation.className} · ${formatScheduledDate(nextEvaluation.scheduledAt)}`;
  }, [nextEvaluation]);

  return (
    <Stack gap={6}>
      <Heading size="lg">Visão Geral</Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <OverviewStatCard
          label="Alunos ativos"
          value={metrics.activeStudents}
          helperText={`Total de ${metrics.students} alunos cadastrados`}
        />
        <OverviewStatCard
          label="Turmas"
          value={metrics.classes}
          helperText="Turmas em acompanhamento"
        />
        <OverviewStatCard
          label="Próxima avaliação"
          value={nextEvaluation?.title ?? 'Nenhuma avaliação agendada'}
          helperText={nextEvaluationHelper}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <UpcomingEvaluationsCard evaluations={evaluations} isLoading={isLoading} />
        <ClassCapacityCard classes={classSummaries} isLoading={isLoading} />
      </SimpleGrid>
    </Stack>
  );
};

export default DashboardPage;

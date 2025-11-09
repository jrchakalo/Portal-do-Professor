import { Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { useMemo, type ReactElement } from 'react';

import { CapacityAlertsCard } from '../components/dashboard/CapacityAlertsCard';
import { ClassCapacityCard } from '../components/dashboard/ClassCapacityCard';
import { EvaluationConfigCard } from '../components/dashboard/EvaluationConfigCard';
import { OverviewStatCard } from '../components/dashboard/OverviewStatCard';
import { PendingEvaluationsCard } from '../components/dashboard/PendingEvaluationsCard';
import { StudentStatusCard } from '../components/dashboard/StudentStatusCard';
import { UpcomingEvaluationsCard } from '../components/dashboard/UpcomingEvaluationsCard';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { formatScheduledDate } from '../utils/date';

const DashboardPage = (): ReactElement => {
  const {
    metrics,
    evaluations,
    classSummaries,
    nextEvaluation,
    pendingEvaluations,
    evaluationConfigs,
    studentStatus,
    capacityAlerts,
    isLoading,
  } = useDashboardOverview();

  const nextEvaluationHelper = useMemo(() => {
    if (!nextEvaluation) {
      return undefined;
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

      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} gap={4}>
        <UpcomingEvaluationsCard evaluations={evaluations} isLoading={isLoading} />
        <ClassCapacityCard classes={classSummaries} isLoading={isLoading} />
        <PendingEvaluationsCard pendingClasses={pendingEvaluations} isLoading={isLoading} />
        <EvaluationConfigCard configs={evaluationConfigs} isLoading={isLoading} />
        <StudentStatusCard status={studentStatus} isLoading={isLoading} />
        <CapacityAlertsCard alerts={capacityAlerts} isLoading={isLoading} />
      </SimpleGrid>
    </Stack>
  );
};

export default DashboardPage;

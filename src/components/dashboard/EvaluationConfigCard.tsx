import { Card, Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import type { EvaluationConfigSummary } from '../../hooks/useDashboardOverview';
import { formatDate } from '../../utils/date';

interface EvaluationConfigCardProps {
  configs: EvaluationConfigSummary[];
  isLoading: boolean;
}

export const EvaluationConfigCard = ({ configs, isLoading }: EvaluationConfigCardProps): ReactElement => {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="md">Configuração de avaliações</Heading>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <Text color="fg.muted">Carregando dados...</Text>
        ) : configs.length === 0 ? (
          <Text color="fg.muted">Nenhuma configuração cadastrada.</Text>
        ) : (
          <Stack gap={3}>
            {configs.slice(0, 5).map((config) => (
              <Stack
                key={config.id}
                gap={1}
                borderBottomWidth="1px"
                borderColor="gray.100"
                _last={{ borderBottomWidth: 0 }}
                pb={2}
              >
                <Heading size="sm">{config.className}</Heading>
                <Text fontSize="sm" color="fg.muted">
                  {config.criteriaCount} critérios · {config.totalWeight}% do peso total
                </Text>
                {!config.isWeightBalanced ? (
                  <Text fontSize="xs" color="red.500">
                    Ajustar pesos para somar 100%.
                  </Text>
                ) : null}
                <Text fontSize="xs" color="fg.muted">
                  Atualizado em {formatDate(config.updatedAt)}
                </Text>
              </Stack>
            ))}
          </Stack>
        )}
      </Card.Body>
    </Card.Root>
  );
};

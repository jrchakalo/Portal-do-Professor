import { Card, Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactElement, ReactNode } from 'react';

interface OverviewStatCardProps {
  label: string;
  value: ReactNode;
  helperText?: ReactNode;
}

export const OverviewStatCard = ({ label, value, helperText }: OverviewStatCardProps): ReactElement => {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="sm" color="fg.muted">
          {label}
        </Heading>
      </Card.Header>
      <Card.Body>
        <Stack gap={1}>
          <Text fontSize="3xl" fontWeight="bold">
            {value}
          </Text>
          {helperText ? (
            <Text fontSize="sm" color="fg.muted">
              {helperText}
            </Text>
          ) : null}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};

import { Card, Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactElement, ReactNode } from 'react';

interface OverviewStatCardProps {
  label: string;
  value: ReactNode;
  helperText?: ReactNode;
}

export const OverviewStatCard = ({ label, value, helperText }: OverviewStatCardProps): ReactElement => {
  const accents = [
    { solid: 'brand.500', soft: 'brand.50' },
    { solid: 'purple.500', soft: 'purple.50' },
    { solid: 'teal.500', soft: 'teal.50' },
    { solid: 'orange.500', soft: 'orange.50' },
  ];
  const accent = accents[label.length % accents.length];

  return (
    <Card.Root
      borderTopWidth="4px"
      borderColor={accent.solid}
      bg={accent.soft}
      boxShadow="md"
    >
      <Card.Header>
        <Heading size="sm" color={accent.solid} textTransform="uppercase" letterSpacing="wide">
          {label}
        </Heading>
      </Card.Header>
      <Card.Body>
        <Stack gap={1}>
          <Text fontSize="3xl" fontWeight="black" color="fg.default">
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

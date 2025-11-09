import {
  Button,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
  chakra,
} from '@chakra-ui/react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash } from 'react-icons/fi';

import type { EvaluationCriterionInput } from '../../types';

interface CriterionField {
  fieldId: string;
  id?: string;
  name: string;
  weight: number | '';
}

interface EvaluationCriteriaFormProps {
  defaultValues?: EvaluationCriterionInput[];
  isSubmitting?: boolean;
  onSubmit: (criteria: EvaluationCriterionInput[]) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

const createFieldId = (): string => `criterion-field-${Math.random().toString(36).slice(2, 11)}`;

const mapToFields = (values: EvaluationCriterionInput[] | undefined): CriterionField[] => {
  if (!values || values.length === 0) {
    return [
      {
        fieldId: createFieldId(),
        name: '',
        weight: 0,
      },
    ];
  }

  return values.map((criterion) => ({
    fieldId: createFieldId(),
    id: criterion.id,
    name: criterion.name,
    weight: criterion.weight,
  }));
};

export const EvaluationCriteriaForm = ({
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
}: EvaluationCriteriaFormProps): ReactElement => {
  const [fields, setFields] = useState<CriterionField[]>(mapToFields(defaultValues));
  const [wasSubmitted, setWasSubmitted] = useState(false);

  useEffect(() => {
    setFields(mapToFields(defaultValues));
    setWasSubmitted(false);
  }, [defaultValues]);

  const totalWeight = useMemo(() => {
    return fields.reduce((sum, field) => sum + Number(field.weight || 0), 0);
  }, [fields]);

  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    fields.forEach((field) => {
      const trimmed = field.name.trim().toLowerCase();
      if (!trimmed) {
        return;
      }
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    });

    return new Set<string>(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name),
    );
  }, [fields]);

  const hasNameError = fields.some((field) => field.name.trim().length === 0);
  const hasWeightError = fields.some((field) => {
    const weightValue = Number(field.weight);
    return field.weight === '' || !Number.isFinite(weightValue) || weightValue <= 0;
  });
  const hasDuplicateNames = duplicateNames.size > 0;

  const isTotalValid = Math.round(totalWeight) === 100;
  const isSubmitDisabled =
    Boolean(isSubmitting) ||
    hasNameError ||
    hasWeightError ||
    hasDuplicateNames ||
    !isTotalValid ||
    fields.length === 0;

  const handleNameChange = useCallback(
    (fieldId: string) =>
      (event: ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        setFields((prev) => prev.map((field) => (field.fieldId === fieldId ? { ...field, name: value } : field)));
      },
    [],
  );

  const handleWeightChange = useCallback(
    (fieldId: string) =>
      (event: ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        setFields((prev) =>
          prev.map((field) =>
            field.fieldId === fieldId
              ? {
                  ...field,
                  weight: value === ''
                    ? ''
                    : Number.isNaN(Number(value))
                      ? field.weight
                      : Number(value),
                }
              : field,
          ),
        );
      },
    [],
  );

  const handleAddCriterion = useCallback((): void => {
    setFields((prev) => [
      ...prev,
      {
        fieldId: createFieldId(),
        name: '',
        weight: 0,
      },
    ]);
  }, []);

  const handleRemoveCriterion = useCallback((fieldId: string): void => {
    setFields((prev) => (prev.length === 1 ? prev : prev.filter((field) => field.fieldId !== fieldId)));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setWasSubmitted(true);

      if (isSubmitDisabled) {
        return;
      }

      const sanitized = fields.map((field) => ({
        id: field.id,
        name: field.name.trim(),
        weight: Number(field.weight),
      }));

      await onSubmit(sanitized);
    },
    [fields, isSubmitDisabled, onSubmit],
  );

  return (
    <chakra.form onSubmit={handleSubmit}>
      <Stack gap={5}>
        <Stack gap={4}>
          {fields.map((field, index) => {
            const trimmedName = field.name.trim();
            const nameInvalid =
              wasSubmitted && (trimmedName.length === 0 || duplicateNames.has(trimmedName.toLowerCase()));
            const weightValue = Number(field.weight);
            const weightInvalid = wasSubmitted && (!Number.isFinite(weightValue) || weightValue <= 0);

            return (
              <Stack key={field.fieldId} gap={3} borderWidth="1px" borderRadius="lg" p={4}>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="semibold">Critério {index + 1}</Text>
                  <IconButton
                    aria-label="Remover critério"
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => handleRemoveCriterion(field.fieldId)}
                    disabled={isSubmitting || fields.length === 1}
                  >
                    <FiTrash />
                  </IconButton>
                </Flex>

                <Field.Root required invalid={nameInvalid}>
                  <Field.Label>Nome</Field.Label>
                  <Input value={field.name} onChange={handleNameChange(field.fieldId)} placeholder="Ex: Prova 1" />
                  {wasSubmitted && trimmedName.length === 0 ? (
                    <Field.ErrorText>Informe o nome do critério.</Field.ErrorText>
                  ) : null}
                  {wasSubmitted && trimmedName.length > 0 && duplicateNames.has(trimmedName.toLowerCase()) ? (
                    <Field.ErrorText>Este nome já está sendo utilizado.</Field.ErrorText>
                  ) : null}
                </Field.Root>

                <Field.Root required invalid={weightInvalid}>
                  <Field.Label>Peso (%)</Field.Label>
                  <Input
                    type="number"
                    min={1}
                    value={field.weight}
                    onChange={handleWeightChange(field.fieldId)}
                    placeholder="Ex: 40"
                  />
                  {weightInvalid ? (
                    <Field.ErrorText>Informe um peso maior que zero.</Field.ErrorText>
                  ) : null}
                </Field.Root>
              </Stack>
            );
          })}
        </Stack>

        <Button type="button" variant="outline" gap={2} onClick={handleAddCriterion} disabled={isSubmitting}>
          <FiPlus />
          <Text as="span">Adicionar critério</Text>
        </Button>

        <Stack gap={1}>
          <Text fontWeight="medium">
            Total: {totalWeight}%
          </Text>
          {!isTotalValid && wasSubmitted ? (
            <Text fontSize="sm" color="red.500">
              A soma dos pesos deve totalizar 100%.
            </Text>
          ) : null}
        </Stack>

        <HStack justify="flex-end" gap={3}>
          {onCancel ? (
            <Button variant="outline" onClick={onCancel} type="button" disabled={isSubmitting}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button type="submit" colorPalette="brand" loading={isSubmitting} disabled={isSubmitDisabled}>
            {submitLabel}
          </Button>
        </HStack>
      </Stack>
    </chakra.form>
  );
};

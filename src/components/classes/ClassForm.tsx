import { Button, Field, Input, Stack, chakra } from '@chakra-ui/react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface ClassFormValues {
  name: string;
  capacity: number;
}

interface ClassFormProps {
  defaultValues?: ClassFormValues;
  onSubmit: (values: ClassFormValues) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

interface ClassFormState {
  name: string;
  capacity: string;
}

const defaultState: ClassFormState = {
  name: '',
  capacity: '30',
};

const sanitizeCapacity = (value: string): string => {
  if (value === '') {
    return value;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return '0';
  }

  return String(Math.floor(parsed));
};

const toState = (values: ClassFormValues | undefined): ClassFormState => {
  if (!values) {
    return defaultState;
  }

  return {
    name: values.name,
    capacity: String(values.capacity),
  };
};

export const ClassForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
}: ClassFormProps): ReactElement => {
  const [state, setState] = useState<ClassFormState>(toState(defaultValues));
  const [wasSubmitted, setWasSubmitted] = useState(false);

  useEffect(() => {
    setState(toState(defaultValues));
    setWasSubmitted(false);
  }, [defaultValues]);

  const trimmedName = state.name.trim();
  const capacityValue = Number(state.capacity);
  const isNameValid = trimmedName.length > 0;
  const isCapacityValid = Number.isInteger(capacityValue) && capacityValue >= 1;

  const isSubmitDisabled = useMemo(() => {
    return isSubmitting || !isNameValid || !isCapacityValid;
  }, [isCapacityValid, isNameValid, isSubmitting]);

  const showNameError = wasSubmitted && !isNameValid;
  const showCapacityError = wasSubmitted && !isCapacityValid;

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setState((prev) => ({ ...prev, name: event.target.value }));
  }, []);

  const handleCapacityChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setState((prev) => ({ ...prev, capacity: sanitizeCapacity(event.target.value) }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setWasSubmitted(true);

      if (isSubmitDisabled) {
        return;
      }

      await onSubmit({
        name: trimmedName,
        capacity: Math.max(1, Math.floor(capacityValue)),
      });
    },
    [capacityValue, isSubmitDisabled, onSubmit, trimmedName],
  );

  return (
    <chakra.form onSubmit={handleSubmit}>
      <Stack gap={5} py={2}>
        <Field.Root required invalid={showNameError}>
          <Field.Label>Nome da turma</Field.Label>
          <Input value={state.name} onChange={handleNameChange} placeholder="Ex: Matemática 101" />
          {showNameError ? <Field.ErrorText>Informe o nome da turma.</Field.ErrorText> : null}
        </Field.Root>

        <Field.Root required invalid={showCapacityError}>
          <Field.Label>Capacidade máxima</Field.Label>
          <Input type="number" min={1} value={state.capacity} onChange={handleCapacityChange} />
          {showCapacityError ? (
            <Field.ErrorText>Informe uma capacidade maior ou igual a 1.</Field.ErrorText>
          ) : null}
        </Field.Root>

        <Stack direction={{ base: 'column', sm: 'row' }} justify="flex-end" gap={3} pt={2}>
          <Button variant="outline" onClick={onCancel} type="button" disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button type="submit" colorPalette="brand" loading={isSubmitting} disabled={isSubmitDisabled}>
            {submitLabel}
          </Button>
        </Stack>
      </Stack>
    </chakra.form>
  );
};

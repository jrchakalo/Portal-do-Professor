import { Button, Field, Input, NativeSelect, Stack, chakra } from '@chakra-ui/react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ClassRoom } from '../../types';
import type { CreateStudentInput, StudentStatus } from '../../types/student';

const emailPattern = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i;

export type StudentFormValues = CreateStudentInput;

interface StudentFormProps {
  defaultValues?: StudentFormValues;
  classes: ClassRoom[];
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

const defaultFormValues: StudentFormValues = {
  name: '',
  email: '',
  classId: null,
  status: 'active',
};

export const StudentForm = ({
  defaultValues,
  classes,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
}: StudentFormProps): ReactElement => {
  const [values, setValues] = useState<StudentFormValues>(defaultValues ?? defaultFormValues);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  useEffect(() => {
    if (defaultValues) {
      setValues(defaultValues);
      setWasSubmitted(false);
    }
  }, [defaultValues]);

  const isNameValid = values.name.trim().length > 0;
  const isEmailValid = emailPattern.test(values.email.trim());

  const isSubmitDisabled = useMemo(() => {
    return isSubmitting || !isNameValid || !isEmailValid;
  }, [isSubmitting, isNameValid, isEmailValid]);

  const showNameError = wasSubmitted && !isNameValid;
  const showEmailError = wasSubmitted && !isEmailValid;

  const handleInputChange = useCallback(
    (field: keyof StudentFormValues) =>
      (event: ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        setValues((prev) => ({ ...prev, [field]: value }));
      },
    [],
  );

  const handleStatusChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    setValues((prev) => ({ ...prev, status: event.target.value as StudentStatus }));
  }, []);

  const handleClassChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    const classId = event.target.value;
    setValues((prev) => ({ ...prev, classId: classId === '' ? null : classId }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setWasSubmitted(true);
      if (isSubmitDisabled) {
        return;
      }

      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        classId: values.classId,
        status: values.status,
      });
    },
    [isSubmitDisabled, onSubmit, values.classId, values.email, values.name, values.status],
  );

  return (
    <chakra.form onSubmit={handleSubmit}>
      <Stack gap={5} py={2}>
        <Field.Root required invalid={showNameError}>
          <Field.Label>Nome completo</Field.Label>
          <Input value={values.name} onChange={handleInputChange('name')} placeholder="Nome do aluno" />
          {showNameError ? <Field.ErrorText>Informe o nome do aluno.</Field.ErrorText> : null}
        </Field.Root>

        <Field.Root required invalid={showEmailError}>
          <Field.Label>E-mail</Field.Label>
          <Input
            type="email"
            value={values.email}
            onChange={handleInputChange('email')}
            placeholder="aluno@escola.com"
          />
          {showEmailError ? <Field.ErrorText>Informe um e-mail válido.</Field.ErrorText> : null}
        </Field.Root>

        <Field.Root>
          <Field.Label>Turma</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={values.classId ?? ''} onChange={handleClassChange}>
              <option value="">Sem turma</option>
              {classes.map((classRoom) => (
                <option key={classRoom.id} value={classRoom.id}>
                  {classRoom.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label>Status</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={values.status} onChange={handleStatusChange}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Stack direction={{ base: 'column', sm: 'row' }} justify="flex-end" gap={3} pt={2}>
          <Button variant="outline" onClick={onCancel} type="button">
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

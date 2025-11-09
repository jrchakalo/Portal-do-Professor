import { Alert, Dialog, Stack } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import type { ClassRoom } from '../../types';
import { StudentForm, type StudentFormValues } from './StudentForm';

type DialogMode = 'create' | 'edit';

interface StudentFormDialogProps {
  open: boolean;
  mode: DialogMode;
  classes: ClassRoom[];
  defaultValues?: StudentFormValues;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
  errorMessage?: string | null;
}

const dialogTitle: Record<DialogMode, string> = {
  create: 'Cadastrar aluno',
  edit: 'Editar aluno',
};

const dialogDescription: Record<DialogMode, string> = {
  create: 'Preencha os dados para cadastrar um novo aluno no portal.',
  edit: 'Atualize as informações do aluno selecionado.',
};

const submitLabel: Record<DialogMode, string> = {
  create: 'Cadastrar',
  edit: 'Salvar alterações',
};

export const StudentFormDialog = ({
  open,
  mode,
  classes,
  defaultValues,
  isSubmitting,
  onClose,
  onSubmit,
  errorMessage,
}: StudentFormDialogProps): ReactElement => {
  const handleOpenChange = ({ open: isOpen }: { open: boolean }): void => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} closeOnInteractOutside={!isSubmitting}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="lg">
          <Dialog.CloseTrigger disabled={isSubmitting} />
          <Dialog.Header>
            <Dialog.Title>{dialogTitle[mode]}</Dialog.Title>
            <Dialog.Description>{dialogDescription[mode]}</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap={4}>
              {errorMessage ? (
                <Alert.Root status="error" borderRadius="md">
                  <Alert.Indicator />
                  <Alert.Content>{errorMessage}</Alert.Content>
                </Alert.Root>
              ) : null}
              <StudentForm
                defaultValues={defaultValues}
                classes={classes}
                onCancel={onClose}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                submitLabel={submitLabel[mode]}
                cancelLabel="Cancelar"
              />
            </Stack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

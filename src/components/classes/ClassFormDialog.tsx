import { Alert, Dialog, Stack } from '@chakra-ui/react';
import type { ReactElement } from 'react';

import { ClassForm, type ClassFormValues } from './ClassForm';

type DialogMode = 'create' | 'edit';

interface ClassFormDialogProps {
  open: boolean;
  mode: DialogMode;
  defaultValues?: ClassFormValues;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ClassFormValues) => Promise<void> | void;
  errorMessage?: string | null;
}

const dialogTitle: Record<DialogMode, string> = {
  create: 'Cadastrar turma',
  edit: 'Editar turma',
};

const dialogDescription: Record<DialogMode, string> = {
  create: 'Informe os dados da turma para disponibilizá-la no portal.',
  edit: 'Atualize as informações da turma selecionada.',
};

const submitLabel: Record<DialogMode, string> = {
  create: 'Cadastrar',
  edit: 'Salvar alterações',
};

export const ClassFormDialog = ({
  open,
  mode,
  defaultValues,
  isSubmitting,
  onClose,
  onSubmit,
  errorMessage,
}: ClassFormDialogProps): ReactElement => {
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
              <ClassForm
                defaultValues={defaultValues}
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

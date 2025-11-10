import { Button, Dialog, Stack, Text } from '@chakra-ui/react';
import type { ReactElement } from 'react';

interface DeleteStudentDialogProps {
  open: boolean;
  studentName?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const DeleteStudentDialog = ({
  open,
  studentName,
  isSubmitting,
  onClose,
  onConfirm,
}: DeleteStudentDialogProps): ReactElement => {
  const handleOpenChange = ({ open: isOpen }: { open: boolean }): void => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} closeOnInteractOutside={!isSubmitting}>
      <Dialog.Backdrop
        position="fixed"
        inset={0}
        bg="blackAlpha.700"
        backdropFilter="blur(12px)"
      />
      <Dialog.Positioner
        position="fixed"
        inset={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={{ base: 4, md: 0 }}
        py={{ base: 8, md: 0 }}
        overflowY="auto"
      >
        <Dialog.Content maxW="sm">
          <Dialog.CloseTrigger disabled={isSubmitting} />
          <Dialog.Header>
            <Dialog.Title>Remover aluno</Dialog.Title>
            <Dialog.Description>
              Essa ação não pode ser desfeita. Confirme para remover o aluno selecionado.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <Text>
              Deseja realmente remover{' '}
              <Text as="span" fontWeight="semibold">
                {studentName ?? 'este aluno'}
              </Text>
              ?
            </Text>
          </Dialog.Body>
          <Dialog.Footer>
            <Stack direction="row" justify="flex-end" gap={3}>
              <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button colorPalette="red" loading={isSubmitting} onClick={() => void onConfirm()}>
                Remover
              </Button>
            </Stack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

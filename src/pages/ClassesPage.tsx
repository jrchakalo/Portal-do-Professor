import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  HStack,
  Heading,
  IconButton,
  Input,
  NativeSelect,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Text,
} from '@chakra-ui/react';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { FiCheckSquare, FiEdit2, FiPlus, FiRefreshCw, FiTrash } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ClassFormDialog } from '../components/classes/ClassFormDialog';
import { DeleteClassDialog } from '../components/classes/DeleteClassDialog';
import type { ClassFormValues } from '../components/classes/ClassForm';
import { OverviewStatCard } from '../components/dashboard/OverviewStatCard';
import { DataTable } from '../components/table/DataTable';
import { useClasses } from '../hooks/useClasses';

type OccupancyFilter = 'all' | 'available' | 'full';

const formatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const ClassesPage = (): ReactElement => {
  const navigate = useNavigate();
  const {
    classes,
    summary,
    isLoading,
    error,
    refresh,
    createClass,
    updateClass,
    deleteClass,
    resetError,
  } = useClasses();

  const [searchTerm, setSearchTerm] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>('all');
  const [isFormOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [classToEdit, setClassToEdit] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editedClass = useMemo(() => classes.find((classRoom) => classRoom.id === classToEdit) ?? null, [classes, classToEdit]);
  const deletedClass = useMemo(() => classes.find((classRoom) => classRoom.id === classToDelete) ?? null, [classes, classToDelete]);

  const availableSeats = Math.max(summary.totalCapacity - summary.totalEnrolled, 0);
  const occupancyPercent = Math.round(summary.occupancyRate * 100);

  const filteredClasses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return classes.filter((classRoom) => {
      const enrolled = classRoom.studentIds.length;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        classRoom.name.toLowerCase().includes(normalizedSearch);

      const matchesOccupancy =
        occupancyFilter === 'all'
          ? true
          : occupancyFilter === 'available'
            ? enrolled < classRoom.capacity
            : enrolled >= classRoom.capacity;

      return matchesSearch && matchesOccupancy;
    });
  }, [classes, occupancyFilter, searchTerm]);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  }, []);

  const handleOccupancyChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    setOccupancyFilter(event.target.value as OccupancyFilter);
  }, []);

  const handleOpenCreate = useCallback((): void => {
    resetError();
    setFormMode('create');
    setClassToEdit(null);
    setFormOpen(true);
  }, [resetError]);

  const handleOpenEdit = useCallback(
    (id: string): void => {
      resetError();
      setFormMode('edit');
      setClassToEdit(id);
      setFormOpen(true);
    },
    [resetError],
  );

  const handleCloseForm = useCallback((): void => {
    setFormOpen(false);
    setClassToEdit(null);
    resetError();
  }, [resetError]);

  const handleOpenDelete = useCallback(
    (id: string): void => {
      resetError();
      setClassToDelete(id);
    },
    [resetError],
  );

  const handleOpenEvaluations = useCallback(
    (id: string): void => {
      resetError();
      navigate(`/turmas/${id}/avaliacoes`);
    },
    [navigate, resetError],
  );

  const handleCloseDelete = useCallback((): void => {
    setClassToDelete(null);
    resetError();
  }, [resetError]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    resetError();
    try {
      await refresh();
    } catch {
      // feedback visual exibido pelo alerta de erro
    }
  }, [refresh, resetError]);

  const handleSubmitForm = useCallback(
    async (values: ClassFormValues): Promise<void> => {
      setIsSaving(true);
      try {
        if (formMode === 'create') {
          await createClass(values);
        } else if (classToEdit) {
          await updateClass(classToEdit, values);
        }
        handleCloseForm();
      } catch {
        // erro exibido via alerta
      } finally {
        setIsSaving(false);
      }
    },
    [classToEdit, createClass, formMode, handleCloseForm, updateClass],
  );

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (!classToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteClass(classToDelete);
      handleCloseDelete();
    } catch {
      // erro exibido via alerta
    } finally {
      setIsDeleting(false);
    }
  }, [classToDelete, deleteClass, handleCloseDelete]);

  const tableHeaders = useMemo(
    () => ['Turma', 'Capacidade', 'Ocupação', 'Ações'].map((label) => <Text key={label}>{label}</Text>),
    [],
  );

  const loadingRows = useMemo(
    () =>
      Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={`loading-row-${index}`}>
          <TableCell colSpan={4}>
            <Skeleton height="5" />
          </TableCell>
        </TableRow>
      )),
    [],
  );

  const tableRows = useMemo(() => {
    if (isLoading) {
      return loadingRows;
    }

    return filteredClasses.map((classRoom) => {
      const enrolled = classRoom.studentIds.length;
      const capacity = classRoom.capacity;
      const statusIsFull = enrolled >= capacity;
      const statusLabel = statusIsFull ? 'Lotada' : 'Com vagas';
      const statusPalette = statusIsFull ? 'red' : 'green';
      const occupancy = capacity > 0 ? Math.min((enrolled / capacity) * 100, 100) : 0;
      const updatedAt = formatter.format(new Date(classRoom.updatedAt));

      return (
        <TableRow key={classRoom.id}>
          <TableCell>
            <Stack gap={0}>
              <Text fontWeight="medium">{classRoom.name}</Text>
              <Text fontSize="sm" color="fg.muted">
                Atualizada em {updatedAt}
              </Text>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack gap={1}>
              <Text fontWeight="medium">
                {enrolled} / {capacity}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                alunos matriculados
              </Text>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack gap={2}>
              <Progress.Root value={enrolled} max={Math.max(capacity, 1)}>
                <Progress.Track bg="gray.100">
                  <Progress.Range bgGradient="linear(to-r, blue.400, yellow.400, red.500)" />
                </Progress.Track>
              </Progress.Root>
              <HStack justify="space-between">
                <Text fontSize="sm" color="fg.muted">
                  {Math.round(occupancy)}%
                </Text>
                <Badge colorPalette={statusPalette} fontSize="sm">
                  {statusLabel}
                </Badge>
              </HStack>
            </Stack>
          </TableCell>
          <TableCell textAlign="right">
                <HStack gap={2} justify="flex-end">
                  <IconButton
                    aria-label="Configurar avaliações"
                    size="sm"
                    variant="subtle"
                    colorPalette="brand"
                    onClick={() => handleOpenEvaluations(classRoom.id)}
                  >
                    <FiCheckSquare />
                  </IconButton>
                  <IconButton
                    aria-label="Editar turma"
                    size="sm"
                    variant="subtle"
                    colorPalette="brand"
                    onClick={() => handleOpenEdit(classRoom.id)}
                  >
                    <FiEdit2 />
                  </IconButton>
                  <IconButton
                    aria-label="Remover turma"
                    size="sm"
                    variant="subtle"
                    colorPalette="red"
                    onClick={() => handleOpenDelete(classRoom.id)}
                  >
                    <FiTrash />
                  </IconButton>
                </HStack>
          </TableCell>
        </TableRow>
      );
    });
  }, [filteredClasses, handleOpenDelete, handleOpenEdit, handleOpenEvaluations, isLoading, loadingRows]);

  const defaultFormValues: ClassFormValues | undefined = useMemo(() => {
    if (!editedClass) {
      return undefined;
    }

    return {
      name: editedClass.name,
      capacity: editedClass.capacity,
    };
  }, [editedClass]);

  const emptyState = useMemo(
    () => (
      <Stack gap={3} align="center" py={10}>
        <Text color="fg.muted">Nenhuma turma encontrada com os filtros selecionados.</Text>
        <Button colorPalette="brand" size="sm" gap={2} onClick={handleOpenCreate}>
          <FiPlus />
          <Text as="span">Cadastrar turma</Text>
        </Button>
      </Stack>
    ),
    [handleOpenCreate],
  );

  return (
    <Stack gap={6}>
      <Stack direction={{ base: 'column', xl: 'row' }} justify="space-between" align={{ base: 'flex-start', xl: 'center' }} gap={4}>
        <Stack gap={1}>
          <Heading size="lg">Turmas</Heading>
          <Text color="fg.muted">Organize as turmas, acompanhe a ocupação e mantenha as vagas atualizadas.</Text>
        </Stack>
          <HStack gap={3} align="center">
            <Button
              variant="outline"
              colorPalette="brand"
              gap={2}
              onClick={() => void handleRefresh()}
              disabled={isLoading || isSaving || isDeleting}
            >
              <FiRefreshCw />
              <Text as="span">Atualizar</Text>
            </Button>
            <Button
              variant="solid"
              colorPalette="brand"
              gap={2}
              onClick={handleOpenCreate}
              disabled={isSaving || isDeleting}
            >
              <FiPlus />
              <Text as="span">Nova turma</Text>
            </Button>
          </HStack>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
        <OverviewStatCard label="Total de turmas" value={summary.totalClasses} />
        <OverviewStatCard label="Turmas lotadas" value={summary.filledClasses} helperText={`${summary.classesWithVacancies} com vagas disponíveis`} />
        <OverviewStatCard label="Vagas disponíveis" value={availableSeats} helperText={`${summary.totalEnrolled} alunos matriculados`} />
        <OverviewStatCard label="Taxa de ocupação" value={`${occupancyPercent}%`} helperText={`${summary.totalEnrolled}/${summary.totalCapacity} vagas preenchidas`} />
      </SimpleGrid>

      {error ? (
        <Alert.Root status="error" borderRadius="md">
          <Alert.Indicator />
          <Alert.Content>{error.message}</Alert.Content>
        </Alert.Root>
      ) : null}

      <Card.Root>
        <Card.Body>
          <Stack direction={{ base: 'column', lg: 'row' }} gap={4} align={{ base: 'stretch', lg: 'flex-end' }}>
            <Field.Root flex="1">
              <Field.Label>Buscar</Field.Label>
              <Input value={searchTerm} onChange={handleSearchChange} placeholder="Nome da turma" />
            </Field.Root>

            <Field.Root w={{ base: 'full', lg: '64' }}>
              <Field.Label>Ocupação</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={occupancyFilter} onChange={handleOccupancyChange}>
                  <option value="all">Todas</option>
                  <option value="available">Com vagas</option>
                  <option value="full">Lotadas</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
          </Stack>
        </Card.Body>
      </Card.Root>

      <DataTable headers={tableHeaders} rows={tableRows} emptyState={emptyState} />

      <ClassFormDialog
        open={isFormOpen}
        mode={formMode}
        defaultValues={defaultFormValues}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        isSubmitting={isSaving}
        errorMessage={isFormOpen ? error?.message ?? null : null}
      />

      <DeleteClassDialog
        open={Boolean(classToDelete)}
        className={deletedClass?.name}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        isSubmitting={isDeleting}
      />
    </Stack>
  );
};

export default ClassesPage;

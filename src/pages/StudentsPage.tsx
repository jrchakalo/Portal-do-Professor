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
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Text,
} from '@chakra-ui/react';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash } from 'react-icons/fi';

import { DeleteStudentDialog } from '../components/students/DeleteStudentDialog';
import { StudentFormDialog } from '../components/students/StudentFormDialog';
import type { StudentFormValues } from '../components/students/StudentForm';
import { DataTable } from '../components/table/DataTable';
import { useStudents } from '../hooks/useStudents';
import type { Student } from '../types';
import type { StudentStatus } from '../types/student';

type StatusFilter = 'all' | StudentStatus;
type ClassFilter = 'all' | 'no-class' | string;

const StudentsPage = (): ReactElement => {
  const {
    students,
    classes,
    isLoading,
    error,
    refresh,
    createStudent,
    updateStudent,
    deleteStudent,
    resetError,
  } = useStudents();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');
  const [isFormOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const classNameById = useMemo(() => {
    return classes.reduce<Record<string, string>>((acc, classRoom) => {
      acc[classRoom.id] = classRoom.name;
      return acc;
    }, {});
  }, [classes]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesClass =
        classFilter === 'all'
          ? true
          : classFilter === 'no-class'
            ? student.classId === null
            : student.classId === classFilter;

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [classFilter, statusFilter, students, searchTerm]);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(event.target.value as StatusFilter);
  }, []);

  const handleClassFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value;
    if (value === 'all' || value === 'no-class') {
      setClassFilter(value);
      return;
    }
    setClassFilter(value);
  }, []);

  const handleOpenCreate = useCallback((): void => {
    resetError();
    setFormMode('create');
    setStudentToEdit(null);
    setFormOpen(true);
  }, [resetError]);

  const handleOpenEdit = useCallback(
    (student: Student): void => {
      resetError();
      setFormMode('edit');
      setStudentToEdit(student);
      setFormOpen(true);
    },
    [resetError],
  );

  const handleCloseForm = useCallback((): void => {
    setFormOpen(false);
    setStudentToEdit(null);
    resetError();
  }, [resetError]);

  const handleOpenDelete = useCallback(
    (student: Student): void => {
      resetError();
      setStudentToDelete(student);
    },
    [resetError],
  );

  const handleCloseDelete = useCallback((): void => {
    setStudentToDelete(null);
    resetError();
  }, [resetError]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    resetError();
    try {
      await refresh();
    } catch {
      // feedback visual já é exibido via alerta de erro
    }
  }, [refresh, resetError]);

  const handleSubmitForm = useCallback(
    async (values: StudentFormValues): Promise<void> => {
      setIsSaving(true);
      try {
        if (formMode === 'create') {
          await createStudent(values);
        } else if (studentToEdit) {
          await updateStudent(studentToEdit.id, values);
        }

        handleCloseForm();
      } catch {
        // erro já tratado pelo estado global de erro
      } finally {
        setIsSaving(false);
      }
    },
    [createStudent, formMode, handleCloseForm, studentToEdit, updateStudent],
  );

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (!studentToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteStudent(studentToDelete.id);
      handleCloseDelete();
    } catch {
      // erro já tratado pelo estado global de erro
    } finally {
      setIsDeleting(false);
    }
  }, [deleteStudent, handleCloseDelete, studentToDelete]);

  const tableHeaders = useMemo(
    () => ['Aluno', 'Turma', 'Status', 'Ações'].map((label) => <Text key={label}>{label}</Text>),
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

    return filteredStudents.map((student) => {
      const className = student.classId ? classNameById[student.classId] ?? 'Turma não encontrada' : 'Sem turma vinculada';
      const statusLabel = student.status === 'active' ? 'Ativo' : 'Inativo';
      const statusPalette = student.status === 'active' ? 'green' : 'gray';

      return (
        <TableRow key={student.id}>
          <TableCell>
            <Stack gap={0}>
              <Text fontWeight="medium">{student.name}</Text>
              <Text fontSize="sm" color="fg.muted">
                {student.email}
              </Text>
            </Stack>
          </TableCell>
          <TableCell>
            <Text>{className}</Text>
          </TableCell>
          <TableCell>
            <Badge colorPalette={statusPalette} fontSize="sm">
              {statusLabel}
            </Badge>
          </TableCell>
          <TableCell textAlign="right">
            <HStack gap={2} justify="flex-end">
              <IconButton aria-label="Editar aluno" size="sm" variant="ghost" onClick={() => handleOpenEdit(student)}>
                <FiEdit2 />
              </IconButton>
              <IconButton
                aria-label="Remover aluno"
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={() => handleOpenDelete(student)}
              >
                <FiTrash />
              </IconButton>
            </HStack>
          </TableCell>
        </TableRow>
      );
    });
  }, [classNameById, filteredStudents, handleOpenDelete, handleOpenEdit, isLoading, loadingRows]);

  const defaultFormValues: StudentFormValues | undefined = useMemo(() => {
    if (!studentToEdit) {
      return undefined;
    }

    return {
      name: studentToEdit.name,
      email: studentToEdit.email,
      classId: studentToEdit.classId,
      status: studentToEdit.status,
    };
  }, [studentToEdit]);

  const emptyState = useMemo(
    () => (
      <Stack gap={3} align="center" py={10}>
        <Text color="fg.muted">Nenhum aluno encontrado com os filtros selecionados.</Text>
        <Button colorPalette="brand" size="sm" gap={2} onClick={handleOpenCreate}>
          <FiPlus />
          <Text as="span">Cadastrar aluno</Text>
        </Button>
      </Stack>
    ),
    [handleOpenCreate],
  );

  return (
    <Stack gap={6}>
      <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
        <Stack gap={1}>
          <Heading size="lg">Alunos</Heading>
          <Text color="fg.muted">Gerencie os alunos matriculados e mantenha os dados sempre atualizados.</Text>
        </Stack>
              <HStack gap={3} align="center">
                <Button
                  variant="outline"
                  gap={2}
                  onClick={() => void handleRefresh()}
                  disabled={isLoading || isSaving || isDeleting}
                >
                  <FiRefreshCw />
                  <Text as="span">Atualizar</Text>
                </Button>
                <Button colorPalette="brand" gap={2} onClick={handleOpenCreate} disabled={isSaving || isDeleting}>
                  <FiPlus />
                  <Text as="span">Novo aluno</Text>
                </Button>
        </HStack>
      </Stack>

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
              <Input
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Nome ou e-mail"
              />
            </Field.Root>

            <Field.Root w={{ base: 'full', lg: '48' }}>
              <Field.Label>Turma</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={classFilter} onChange={handleClassFilterChange}>
                  <option value="all">Todas as turmas</option>
                  <option value="no-class">Sem turma</option>
                  {classes.map((classRoom) => (
                    <option key={classRoom.id} value={classRoom.id}>
                      {classRoom.name}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root w={{ base: 'full', lg: '40' }}>
              <Field.Label>Status</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={statusFilter} onChange={handleStatusFilterChange}>
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
          </Stack>
        </Card.Body>
      </Card.Root>

      <DataTable headers={tableHeaders} rows={tableRows} emptyState={emptyState} />

      <StudentFormDialog
        open={isFormOpen}
        mode={formMode}
        classes={classes}
        defaultValues={defaultFormValues}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        isSubmitting={isSaving}
        errorMessage={isFormOpen ? error?.message ?? null : null}
      />

      <DeleteStudentDialog
        open={Boolean(studentToDelete)}
        studentName={studentToDelete?.name}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        isSubmitting={isDeleting}
      />
    </Stack>
  );
};

export default StudentsPage;

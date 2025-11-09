export type StudentStatus = 'active' | 'inactive';

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string | null;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  name: string;
  email: string;
  classId: string | null;
  status: StudentStatus;
}

export type UpdateStudentInput = Partial<CreateStudentInput>;

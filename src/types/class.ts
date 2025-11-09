export interface ClassRoom {
  id: string;
  name: string;
  capacity: number;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassInput {
  name: string;
  capacity: number;
}

export type UpdateClassInput = Partial<CreateClassInput>;

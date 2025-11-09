import type {
	AuthCredentials,
	AuthSession,
	ClassRoom,
	EvaluationConfig,
	UpcomingEvaluation,
	User,
} from '../types';
import type { Student } from '../types/student';
import { generateId } from '../utils/id';
import { simulateNetworkDelay } from '../utils/promise';

type InternalUser = User & { password: string };

interface SessionRecord {
	accessToken: string;
	refreshToken: string;
	userId: string;
	expiresAt: number;
}

interface MockDatabase {
	users: InternalUser[];
	classes: ClassRoom[];
	students: Student[];
	evaluationConfigs: EvaluationConfig[];
	upcomingEvaluations: UpcomingEvaluation[];
	sessions: Map<string, SessionRecord>;
}

const ACCESS_TOKEN_TTL = 60 * 60 * 1000; // 1 hour
const nowIso = (): string => new Date().toISOString();

const cloneUser = (user: InternalUser): User => ({
	id: user.id,
	name: user.name,
	email: user.email,
	role: user.role,
});

const seedUsers: InternalUser[] = [
	{
		id: 'user-1',
		name: 'Ana Professora',
		email: 'professora@portal.com',
		role: 'teacher',
		password: 'senha123',
	},
];

const seedClasses: ClassRoom[] = [
	{
		id: 'class-1',
		name: 'Turma Matemática 101',
		capacity: 35,
		studentIds: [],
		createdAt: nowIso(),
		updatedAt: nowIso(),
	},
	{
		id: 'class-2',
		name: 'Turma Física 201',
		capacity: 30,
		studentIds: [],
		createdAt: nowIso(),
		updatedAt: nowIso(),
	},
];

const seedStudents: Student[] = [
	{
		id: 'student-1',
		name: 'Beatriz Souza',
		email: 'beatriz.souza@email.com',
		classId: 'class-1',
		status: 'active',
		createdAt: nowIso(),
		updatedAt: nowIso(),
	},
	{
		id: 'student-2',
		name: 'Carlos Lima',
		email: 'carlos.lima@email.com',
		classId: 'class-1',
		status: 'active',
		createdAt: nowIso(),
		updatedAt: nowIso(),
	},
	{
		id: 'student-3',
		name: 'Daniela Martins',
		email: 'daniela.martins@email.com',
		classId: 'class-2',
		status: 'inactive',
		createdAt: nowIso(),
		updatedAt: nowIso(),
	},
];

seedClasses.forEach((classRoom) => {
	classRoom.studentIds = seedStudents
		.filter((student) => student.classId === classRoom.id)
		.map((student) => student.id);
});

const seedEvaluationConfigs: EvaluationConfig[] = [
	{
		classId: 'class-1',
		criteria: [
			{ id: generateId('criterion'), name: 'Prova 1', weight: 50 },
			{ id: generateId('criterion'), name: 'Trabalho em grupo', weight: 30 },
			{ id: generateId('criterion'), name: 'Participação', weight: 20 },
		],
		updatedAt: nowIso(),
	},
	{
		classId: 'class-2',
		criteria: [
			{ id: generateId('criterion'), name: 'Exame final', weight: 60 },
			{ id: generateId('criterion'), name: 'Projetos práticos', weight: 40 },
		],
		updatedAt: nowIso(),
	},
];

const seedUpcomingEvaluations: UpcomingEvaluation[] = [
	{
		id: 'evaluation-1',
		classId: 'class-1',
		title: 'Prova 1 - Matemática 101',
		scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: 'evaluation-2',
		classId: 'class-2',
		title: 'Exame final - Física 201',
		scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
	},
];

const database: MockDatabase = {
	users: [...seedUsers],
	classes: [...seedClasses],
	students: [...seedStudents],
	evaluationConfigs: [...seedEvaluationConfigs],
	upcomingEvaluations: [...seedUpcomingEvaluations],
	sessions: new Map(),
};

const createSessionRecord = (userId: string): SessionRecord => {
	const accessToken = generateId('access-token');
	const refreshToken = generateId('refresh-token');
	const now = Date.now();

	return {
		accessToken,
		refreshToken,
		userId,
		expiresAt: now + ACCESS_TOKEN_TTL,
	};
};

const persistSession = (record: SessionRecord): AuthSession => {
	database.sessions.set(record.accessToken, record);

	const user = database.users.find((candidate) => candidate.id === record.userId);
	if (!user) {
		throw new Error('USER_NOT_FOUND');
	}

	return {
		user: cloneUser(user),
		tokens: {
			accessToken: record.accessToken,
			refreshToken: record.refreshToken,
		},
		issuedAt: nowIso(),
	};
};

const invalidateToken = (token: string): void => {
	database.sessions.delete(token);
};

const findUserByEmail = (email: string): InternalUser | undefined =>
	database.users.find((user) => user.email.toLowerCase() === email.toLowerCase());

export const mockServer = {
	async login(credentials: AuthCredentials): Promise<AuthSession> {
		await simulateNetworkDelay();

		const user = findUserByEmail(credentials.email);
		if (!user || user.password !== credentials.password) {
			throw new Error('INVALID_CREDENTIALS');
		}

		const record = createSessionRecord(user.id);
		return persistSession(record);
	},

	async logout(accessToken: string): Promise<void> {
		await simulateNetworkDelay();
		invalidateToken(accessToken);
	},

	async refreshSession(refreshToken: string): Promise<AuthSession> {
		await simulateNetworkDelay();

		const existing = Array.from(database.sessions.values()).find(
			(session) => session.refreshToken === refreshToken,
		);

		if (!existing) {
			throw new Error('INVALID_TOKEN');
		}

		invalidateToken(existing.accessToken);
		const record = createSessionRecord(existing.userId);
		return persistSession(record);
	},

	verifyAccessToken(accessToken: string): User | null {
		const record = database.sessions.get(accessToken);
		if (!record) {
			return null;
		}

		if (record.expiresAt < Date.now()) {
			invalidateToken(accessToken);
			return null;
		}

		const user = database.users.find((candidate) => candidate.id === record.userId);
		return user ? cloneUser(user) : null;
	},

	snapshot() {
		return {
			users: database.users.map(cloneUser),
			classes: [...database.classes],
			students: [...database.students],
			evaluationConfigs: [...database.evaluationConfigs],
			upcomingEvaluations: [...database.upcomingEvaluations],
		};
	},
};

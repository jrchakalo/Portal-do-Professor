import '@testing-library/jest-dom';

import { render, screen } from '../../../test-utils';
import { UpcomingEvaluationsList } from '../UpcomingEvaluationsList';
import type { ClassRoom, UpcomingEvaluation } from '../../../types';

describe('UpcomingEvaluationsList', () => {
  const baseClasses: ClassRoom[] = [
    {
      id: 'class-1',
      name: 'Turma A',
      capacity: 30,
      studentIds: ['student-1', 'student-2'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  it('shows an empty message when there are no upcoming evaluations', () => {
    render(<UpcomingEvaluationsList evaluations={[]} classes={baseClasses} />);

    expect(
      screen.getByText('Nenhuma avaliação agendada para os próximos dias.'),
    ).toBeInTheDocument();
  });

  it('renders each evaluation with its class name and scheduled date', () => {
    const evaluations: UpcomingEvaluation[] = [
      {
        id: 'evaluation-1',
        classId: 'class-1',
        title: 'Prova de Matemática',
        scheduledAt: '2025-11-10T14:30:00.000Z',
      },
      {
        id: 'evaluation-2',
        classId: 'class-2',
        title: 'Apresentação de História',
        scheduledAt: '2025-11-12T09:00:00.000Z',
      },
    ];

    const formatter = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    render(<UpcomingEvaluationsList evaluations={evaluations} classes={baseClasses} />);

    expect(screen.getByText('Prova de Matemática')).toBeInTheDocument();
    expect(screen.getByText('Apresentação de História')).toBeInTheDocument();

    expect(screen.getByText('Turma A')).toBeInTheDocument();
    expect(screen.getByText('Turma não encontrada')).toBeInTheDocument();

    expect(
      screen.getByText(formatter.format(new Date('2025-11-10T14:30:00.000Z'))),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatter.format(new Date('2025-11-12T09:00:00.000Z'))),
    ).toBeInTheDocument();
  });
});

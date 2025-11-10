import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../test-utils';
import { EvaluationCriteriaForm } from '../EvaluationCriteriaForm';
import type { EvaluationCriterionInput } from '../../../types';

describe('EvaluationCriteriaForm', () => {
  const baseCriteria: EvaluationCriterionInput[] = [
    { id: 'crit-1', name: 'Prova 1', weight: 60 },
    { id: 'crit-2', name: 'Trabalho', weight: 40 },
  ];

  const createSubmitSpy = () => jest.fn<void, [EvaluationCriterionInput[]]>();

  it('submits sanitized criteria when total weight is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = createSubmitSpy();

    render(
      <EvaluationCriteriaForm
        defaultValues={baseCriteria}
        onSubmit={onSubmit}
        submitLabel="Salvar"
      />
    );

    const nameInputs = screen.getAllByLabelText('Nome');
    await user.clear(nameInputs[0]);
    await user.type(nameInputs[0], '  Prova final  ');

    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith([
      { id: 'crit-1', name: 'Prova final', weight: 60 },
      { id: 'crit-2', name: 'Trabalho', weight: 40 },
    ]);
  });

  it('blocks submission when the total weight is not 100%', async () => {
    const user = userEvent.setup();
    const onSubmit = createSubmitSpy();

    render(
      <EvaluationCriteriaForm
        defaultValues={baseCriteria}
        onSubmit={onSubmit}
      />
    );

    const weightInputs = screen.getAllByLabelText('Peso (%)');
    await user.clear(weightInputs[0]);
    await user.type(weightInputs[0], '50');

    const submitButton = screen.getByRole('button', { name: /salvar/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows duplicate name error when criteria share the same name', async () => {
    const user = userEvent.setup();
    const onSubmit = createSubmitSpy();

    const { container } = render(
      <EvaluationCriteriaForm
        defaultValues={baseCriteria}
        onSubmit={onSubmit}
        submitLabel="Salvar"
      />
    );

    await user.click(screen.getByRole('button', { name: /adicionar critério/i }));

    const nameInputs = screen.getAllByLabelText('Nome');
    const weightInputs = screen.getAllByLabelText('Peso (%)');

    await user.clear(weightInputs[0]);
    await user.type(weightInputs[0], '40');
    await user.clear(weightInputs[1]);
    await user.type(weightInputs[1], '40');
    await user.clear(weightInputs[2]);
    await user.type(weightInputs[2], '20');

    await user.type(nameInputs[2], 'Prova 1');

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(screen.getAllByText('Este nome já está sendo utilizado.')).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows weight error when a criterion has non-positive weight', () => {
    const onSubmit = createSubmitSpy();

    const { container } = render(
      <EvaluationCriteriaForm
        defaultValues={baseCriteria}
        onSubmit={onSubmit}
      />
    );

    const weightInputs = screen.getAllByLabelText('Peso (%)');
    fireEvent.change(weightInputs[0], { target: { value: '0' } });

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(screen.getByText('Informe um peso maior que zero.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows cancelling the edit flow', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn<void, []>();
    const onSubmit = createSubmitSpy();

    render(
      <EvaluationCriteriaForm
        defaultValues={baseCriteria}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('adds and removes criteria rows', async () => {
    const user = userEvent.setup();

    render(
      <EvaluationCriteriaForm
        defaultValues={baseCriteria}
        onSubmit={createSubmitSpy()}
      />
    );

    const headings = () => screen.getAllByText(/^Critério \d+/i);
    expect(headings()).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /adicionar critério/i }));
    expect(headings()).toHaveLength(3);

    const removeButtons = screen.getAllByRole('button', { name: 'Remover critério' });
    await user.click(removeButtons[2]);

    expect(headings()).toHaveLength(2);
  });
});

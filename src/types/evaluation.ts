export interface EvaluationCriterion {
  id: string;
  name: string;
  weight: number;
}

export interface EvaluationConfig {
  classId: string;
  criteria: EvaluationCriterion[];
  updatedAt: string;
}

export interface UpcomingEvaluation {
  id: string;
  classId: string;
  title: string;
  scheduledAt: string;
}

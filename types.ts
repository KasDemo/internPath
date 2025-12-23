export enum Role {
  Frontend = 'Front End Developer',
  Backend = 'Back End Developer',
  UXUI = 'UX/UI Designer',
  ProjectCoord = 'Project Coordinator',
  QA = 'QA Tester'
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  category: Role;
}

export interface AssessmentResult {
  recommendedRole: Role;
  scores: Record<string, number>; // Percentage 0-100 for each role
  reasoning: string;
  preparationSteps: string[];
  roadmap: {
    phase: string;
    description: string;
    resources: string[];
  }[];
}

export type AppState = 'intro' | 'quiz' | 'upload' | 'analyzing' | 'results';

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, string>; // questionId -> selectedOption
}

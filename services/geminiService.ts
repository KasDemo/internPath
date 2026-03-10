import { Question, AssessmentResult } from '../types';
import { staticQuestions } from '../data/questions';

// Return static questions immediately
export const generateQuizQuestions = async (): Promise<Question[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(staticQuestions);
    }, 500);
  });
};

// Main analyze function - calls backend API (API keys are safe on server)
export const analyzeCareerPath = async (
  questions: Question[],
  answers: Record<number, string>,
  pdfContext?: string,
  modelType: 'openai' | 'gemini' = 'gemini'
): Promise<AssessmentResult> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, answers, pdfContext, modelType })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    return await response.json() as AssessmentResult;
  } catch (e: unknown) {
    const error = e as Error;
    console.error(`Analysis Error (${modelType}):`, error.message);
    throw new Error(`Failed to analyze with ${modelType}: ${error.message}`);
  }
};
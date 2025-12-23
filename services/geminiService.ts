import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { Question, Role, AssessmentResult } from '../types';
import { staticQuestions } from '../data/questions';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key not found");
  return new GoogleGenAI({ apiKey });
};

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API Key not found");
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

// Return static questions immediately
export const generateQuizQuestions = async (): Promise<Question[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(staticQuestions);
    }, 500);
  });
};

// Build prompt for analysis
const buildPrompt = (
  qaPairs: { question: string; category: string; userAnswer: string }[],
  pdfContext?: string,
  systemInstruction?: string
) => {
  const contextPrompt = pdfContext 
    ? `\n\nADDITIONAL CONTEXT (Course Syllabus the student studied): \n${pdfContext}\n\nINSTRUCTION: Analyze the syllabus details. Mention specific subjects from the syllabus in your reasoning and roadmap.`
    : `\n\nINSTRUCTION: Base your advice solely on the quiz results.`;

  return `
    Analyze the following quiz results for a Software Engineering student looking for an internship.
    
    Role: ${systemInstruction}

    Quiz Data: ${JSON.stringify(qaPairs)}
    ${contextPrompt}

    Task:
    1. Calculate a compatibility score (0-100) for each of the 5 roles.
    2. Determine the #1 Recommended Role.
    3. Provide **Reasoning** in **Thai language**.
    4. List 3-5 specific **Preparation Steps** in **Thai language**.
    5. Create a step-by-step **Learning Roadmap** in **Thai language**.
    6. In the roadmap resources, provide specific **Searchable Keywords** or **Official Documentation Names**.
    
    IMPORTANT: Return the scores object with these exact keys:
    - frontend (for Front End Developer)
    - backend (for Back End Developer)
    - uxui (for UX/UI Designer)
    - projectCoord (for Project Coordinator)
    - qa (for QA Tester)
    
    **Output Language: Thai (ภาษาไทย)**
    Return strictly JSON with this structure:
    {
      "recommendedRole": "Front End Developer" | "Back End Developer" | "UX/UI Designer" | "Project Coordinator" | "QA Tester",
      "scores": { "frontend": number, "backend": number, "uxui": number, "projectCoord": number, "qa": number },
      "reasoning": "string",
      "preparationSteps": ["string"],
      "roadmap": [{ "phase": "string", "description": "string", "resources": ["string"] }]
    }
  `;
};

// Parse AI response to AssessmentResult
const parseResult = (text: string): AssessmentResult => {
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawResult = JSON.parse(cleanedText) as any;
  
  const scores = {
    [Role.Frontend]: rawResult.scores.frontend,
    [Role.Backend]: rawResult.scores.backend,
    [Role.UXUI]: rawResult.scores.uxui,
    [Role.ProjectCoord]: rawResult.scores.projectCoord,
    [Role.QA]: rawResult.scores.qa,
  };

  return {
    ...rawResult,
    scores
  } as AssessmentResult;
};

// Analyze with OpenAI (gpt-5)
const analyzeWithOpenAI = async (
  qaPairs: { question: string; category: string; userAnswer: string }[],
  pdfContext?: string
): Promise<AssessmentResult> => {
  const client = getOpenAIClient();
  
  const systemInstruction = "You are a Senior Career Coach and Technical Interviewer from a top tech company (e.g., Google, Microsoft). Your advice is critical, in-depth, and focuses on high-standard industry requirements. You provide a 'Second Opinion' that might differ from standard advice.";
  
  const prompt = buildPrompt(qaPairs, pdfContext, systemInstruction);

  const response = await client.responses.create({
    model: "gpt-4o",
    input: prompt
  });

  const text = response.output_text;
  if (!text) throw new Error("Failed to analyze results: Empty response from OpenAI");

  return parseResult(text);
};

// Analyze with Gemini Pro
const analyzeWithGemini = async (
  qaPairs: { question: string; category: string; userAnswer: string }[],
  pdfContext?: string
): Promise<AssessmentResult> => {
  const ai = getGeminiClient();
  
  const systemInstruction = "You are a supportive and encouraging Career Counselor for university students. Your tone is friendly, accessible, and motivating.";
  
  const prompt = buildPrompt(qaPairs, pdfContext, systemInstruction);

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendedRole: { type: Type.STRING, enum: Object.values(Role) },
          scores: { 
            type: Type.OBJECT, 
            properties: {
              frontend: { type: Type.NUMBER },
              backend: { type: Type.NUMBER },
              uxui: { type: Type.NUMBER },
              projectCoord: { type: Type.NUMBER },
              qa: { type: Type.NUMBER },
            },
            required: ["frontend", "backend", "uxui", "projectCoord", "qa"]
          },
          reasoning: { type: Type.STRING },
          preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phase: { type: Type.STRING },
                description: { type: Type.STRING },
                resources: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["phase", "description", "resources"]
            }
          }
        },
        required: ["recommendedRole", "scores", "reasoning", "preparationSteps", "roadmap"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to analyze results: Empty response from Gemini");

  return parseResult(text);
};

// Main analyze function
export const analyzeCareerPath = async (
  questions: Question[],
  answers: Record<number, string>,
  pdfContext?: string,
  modelType: 'openai' | 'gemini' = 'gemini'
): Promise<AssessmentResult> => {
  const qaPairs = questions.map(q => ({
    question: q.text,
    category: q.category,
    userAnswer: answers[q.id] || "No Answer"
  }));

  try {
    if (modelType === 'openai') {
      return await analyzeWithOpenAI(qaPairs, pdfContext);
    } else {
      return await analyzeWithGemini(qaPairs, pdfContext);
    }
  } catch (e: unknown) {
    const error = e as Error;
    console.error(`Analysis Error (${modelType}):`, error);
    console.error('Error details:', error.message);
    if ('response' in error) {
      console.error('Response:', (error as { response?: unknown }).response);
    }
    throw new Error(`Failed to analyze with ${modelType}: ${error.message}`);
  }
};
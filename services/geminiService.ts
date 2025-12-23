import { GoogleGenAI, Type } from "@google/genai";
import { Question, Role, AssessmentResult } from '../types';
import { staticQuestions } from '../data/questions';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Return static questions immediately
export const generateQuizQuestions = async (): Promise<Question[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(staticQuestions);
    }, 500);
  });
};

// Analyze results
export const analyzeCareerPath = async (
  questions: Question[],
  answers: Record<number, string>,
  pdfContext?: string,
  modelType: 'flash' | 'pro' = 'flash'
): Promise<AssessmentResult> => {
  const ai = getAiClient();

  // Format Q&A for the AI
  const qaPairs = questions.map(q => ({
    question: q.text,
    category: q.category,
    userAnswer: answers[q.id] || "No Answer"
  }));

  const contextPrompt = pdfContext 
    ? `\n\nADDITIONAL CONTEXT (Course Syllabus the student studied): \n${pdfContext}\n\nINSTRUCTION: Analyze the syllabus details. Mention specific subjects from the syllabus in your reasoning and roadmap.`
    : `\n\nINSTRUCTION: Base your advice solely on the quiz results.`;

  // Define different personas based on model type
  let systemInstruction = "";
  if (modelType === 'pro') {
    systemInstruction = "You are a Senior Career Coach and Technical Interviewer from a top tech company (e.g., Google, Microsoft). Your advice is critical, in-depth, and focuses on high-standard industry requirements. You provide a 'Second Opinion' that might differ from standard advice.";
  } else {
    systemInstruction = "You are a supportive and encouraging Career Counselor for university students. Your tone is friendly, accessible, and motivating.";
  }

  const prompt = `
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
    Return strictly JSON.
  `;

  // Select model based on type
  const modelName = modelType === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const response = await ai.models.generateContent({
    model: modelName,
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

  let text = response.text;
  if (!text) throw new Error("Failed to analyze results: Empty response");

  text = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawResult = JSON.parse(text) as any;
    
    // Map simple keys back to Role enum
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
  } catch (e) {
    console.error("JSON Parse Error. Text received:", text);
    throw new Error("Invalid JSON response from AI. Please try again.");
  }
};
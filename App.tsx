import React, { useState, useCallback } from 'react';
import { AppState, Question, AssessmentResult } from './types';
import { generateQuizQuestions, analyzeCareerPath } from './services/geminiService';
import { DEFAULT_SYLLABUS } from './data/syllabus';
import Login from './components/Login';
import Quiz from './components/Quiz';
import Results from './components/Results';
import { BrainCircuit, Loader2, LogOut } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
  const [appState, setAppState] = useState<AppState>('intro');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Store structured results for both models and both contexts
  const [results, setResults] = useState<{
    openai: { pure: AssessmentResult | null; context: AssessmentResult | null };
    gemini: { pure: AssessmentResult | null; context: AssessmentResult | null };
  }>( {
    openai: { pure: null, context: null },
    gemini: { pure: null, context: null }
  });

  const handleStartQuiz = async () => {
    setLoading(true);
    setLoadingMessage('กำลังเตรียมแบบทดสอบวัดแวว...');
    try {
      const qs = await generateQuizQuestions();
      setQuestions(qs);
      setAppState('quiz');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการสร้างแบบทดสอบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const processResults = useCallback(async (userAnswers: Record<number, string>) => {
    setAppState('analyzing');
    setLoading(true);
    setLoadingMessage('AI กำลังวิเคราะห์ข้อมูลทั้ง 4 มิติ (OpenAI/Gemini x ปกติ/หลักสูตร)...');
    
    try {
      // Execute 4 analyses in parallel to support the new UI structure
      const [openaiPure, openaiContext, geminiPure, geminiContext] = await Promise.all([
        // 1. OpenAI Pure
        analyzeCareerPath(questions, userAnswers, undefined, 'openai', token!),
        // 2. OpenAI + Context
        analyzeCareerPath(questions, userAnswers, DEFAULT_SYLLABUS, 'openai', token!),
        // 3. Gemini Pure
        analyzeCareerPath(questions, userAnswers, undefined, 'gemini', token!),
        // 4. Gemini + Context
        analyzeCareerPath(questions, userAnswers, DEFAULT_SYLLABUS, 'gemini', token!)
      ]);

      setResults({
        openai: { pure: openaiPure, context: openaiContext },
        gemini: { pure: geminiPure, context: geminiContext }
      });

      setAppState('results');
    } catch (error) {
      console.error(error);
      alert('การวิเคราะห์ล้มเหลว กรุณาลองใหม่อีกครั้ง');
      setAppState('intro');
    } finally {
      setLoading(false);
    }
  }, [questions]);

  const handleQuizComplete = (userAnswers: Record<number, string>) => {
    setAnswers(userAnswers);
    processResults(userAnswers);
  };

  const handleRestart = () => {
    setAppState('intro');
    setAnswers({});
    setResults({
      openai: { pure: null, context: null },
      gemini: { pure: null, context: null }
    });
    window.scrollTo(0, 0);
  };

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem('token');
    handleRestart();
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleRestart}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">InternPath <span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500 hidden md:block">
              สำหรับนักศึกษา Software Engineering
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-700 font-medium animate-pulse">{loadingMessage}</p>
          </div>
        )}

        {appState === 'intro' && (
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            
            <div className="flex justify-center mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100 border border-indigo-50 transform hover:scale-105 transition-transform duration-300">
                <BrainCircuit className="w-20 h-20 text-indigo-600" />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
              ค้นหาตำแหน่ง <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">ฝึกงานที่ใช่</span> สำหรับคุณ
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              ทำแบบทดสอบวัดความถนัดเชิงพฤติกรรม 20 ข้อ เพื่อค้นหาตัวตนที่แท้จริงของคุณ (Frontend, Backend, UX/UI, QA, Coordinator) พร้อมรับคำแนะนำจาก <span className="font-semibold text-indigo-600">AI Advisor 2 บุคลิก</span> เปรียบเทียบผลลัพธ์แบบเจาะลึก
            </p>
            <button 
              onClick={handleStartQuiz}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-10 py-4 rounded-full shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
            >
              เริ่มทำแบบทดสอบ
            </button>
            
            <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4 opacity-70">
              {['Frontend', 'Backend', 'UX/UI', 'QA Tester', 'Coordinator'].map((role) => (
                <div key={role} className="p-4 bg-white border border-slate-100 rounded-xl text-sm font-medium text-slate-500 shadow-sm">
                  {role}
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === 'quiz' && (
          <div className="py-10">
            <Quiz questions={questions} onComplete={handleQuizComplete} />
          </div>
        )}

        {appState === 'results' && (
          <Results 
            results={results} 
            onRestart={handleRestart}
          />
        )}

      </main>
    </div>
  );
}
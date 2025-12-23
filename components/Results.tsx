import React, { useState } from 'react';
import { AssessmentResult, Role } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { 
  Briefcase, 
  BookOpen, 
  ListChecks, 
  GraduationCap,
  ExternalLink,
  RotateCcw,
  Zap,
  Bot,
  FileText,
  User
} from 'lucide-react';

interface ResultsProps {
  results: {
    flash: { pure: AssessmentResult | null; context: AssessmentResult | null };
    pro: { pure: AssessmentResult | null; context: AssessmentResult | null };
  };
  onRestart: () => void;
}

const Results: React.FC<ResultsProps> = ({ results, onRestart }) => {
  // Level 1 Tab: Model Group
  const [activeModel, setActiveModel] = useState<'flash' | 'pro'>('flash');
  // Level 2 Tab: Data Source Context
  const [activeContext, setActiveContext] = useState<'pure' | 'context'>('pure');

  const modelData = activeModel === 'flash' ? results.flash : results.pro;
  const currentResult = activeContext === 'pure' ? modelData.pure : modelData.context;

  if (!currentResult) return null;

  const chartData = Object.entries(currentResult.scores).map(([role, score]) => ({
    name: role,
    score: score
  }));

  const COLORS = {
    [Role.Frontend]: '#6366f1', // Indigo
    [Role.Backend]: '#ec4899', // Pink
    [Role.UXUI]: '#8b5cf6', // Violet
    [Role.ProjectCoord]: '#f59e0b', // Amber
    [Role.QA]: '#10b981', // Emerald
  };

  const getThemeColor = (type: 'bg' | 'text' | 'border' | 'gradient', intensity: number = 500) => {
    if (activeModel === 'flash') {
      if (type === 'gradient') return 'from-indigo-600 to-violet-700';
      return `${type}-indigo-${intensity}`;
    } else {
      if (type === 'gradient') return 'from-emerald-600 to-teal-700';
      return `${type}-emerald-${intensity}`;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">สรุปผลการวิเคราะห์</h2>
          <p className="text-slate-500">เลือกดูมุมมองจาก AI และข้อมูลประกอบเพื่อการตัดสินใจที่ดีที่สุด</p>
        </div>
        <button 
          onClick={onRestart}
          className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          ทำแบบทดสอบใหม่
        </button>
      </div>

      {/* Level 1: Model Selection Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-100 p-1.5 rounded-xl inline-flex shadow-inner gap-1 w-full md:w-auto">
          <button
            onClick={() => setActiveModel('flash')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeModel === 'flash' 
                ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            Gemini Flash
            <span className="hidden md:inline text-xs font-normal opacity-75 ml-1">(ผู้ช่วยแนะแนว)</span>
          </button>
          <button
            onClick={() => setActiveModel('pro')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeModel === 'pro'
                ? 'bg-white text-emerald-600 shadow-md ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Bot className="w-4 h-4" />
            Gemini Pro (ChatGPT)
            <span className="hidden md:inline text-xs font-normal opacity-75 ml-1">(ที่ปรึกษาอาวุโส)</span>
          </button>
        </div>
      </div>

      {/* Level 2: Data Source Context Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
          <button
            onClick={() => setActiveContext('pure')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              activeContext === 'pure'
                ? `bg-slate-800 text-white shadow-sm`
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            ผลลัพธ์แบบ AI ล้วนๆ
          </button>
          <button
            onClick={() => setActiveContext('context')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              activeContext === 'context'
                ? `bg-slate-800 text-white shadow-sm`
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            ผลลัพธ์ + หลักสูตร (PDF)
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" key={`${activeModel}-${activeContext}`}>
        
        {/* Main Recommendation Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.02] duration-300 bg-gradient-to-br ${getThemeColor('gradient')}`}>
            <div className="flex items-center gap-3 mb-4 opacity-90">
              <Briefcase className="w-6 h-6" />
              <span className="text-sm font-medium uppercase tracking-wider">อาชีพที่แนะนำสูงสุด</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">{currentResult.recommendedRole}</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              {currentResult.reasoning.split('.')[0]}.
            </p>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-[300px]">
             <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">คะแนนความเหมาะสม (%)</h4>
             <ResponsiveContainer width="100%" height="90%">
               <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                 <XAxis type="number" domain={[0, 100]} hide />
                 <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} interval={0} />
                 <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as Role] || '#cbd5e1'} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Details Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Reasoning */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${activeModel === 'flash' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-800">
                มุมมองจาก {activeModel === 'flash' ? 'Gemini AI' : 'ChatGPT (Simulated)'}
                {activeContext === 'context' && <span className="text-sm font-normal text-slate-500 ml-2">(วิเคราะห์ร่วมกับรายวิชา)</span>}
              </h4>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-line">
              {currentResult.reasoning}
            </p>
          </div>

          {/* Preparation Steps */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${activeModel === 'flash' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <ListChecks className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-800">สิ่งที่ต้องเตรียมตัว</h4>
            </div>
            <ul className="space-y-3">
              {currentResult.preparationSteps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-slate-600 text-sm md:text-base">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeModel === 'flash' 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${activeModel === 'flash' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-800">แผนการเรียนรู้ (Roadmap)</h4>
            </div>
            
            <div className={`relative border-l-2 ml-3 space-y-8 ${activeModel === 'flash' ? 'border-indigo-100' : 'border-emerald-100'}`}>
              {currentResult.roadmap.map((step, idx) => (
                <div key={idx} className="pl-8 relative group">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 transition-colors ${
                    activeModel === 'flash' 
                      ? 'border-indigo-400 group-hover:bg-indigo-600' 
                      : 'border-emerald-400 group-hover:bg-emerald-600'
                  }`} />
                  
                  <h5 className={`font-semibold mb-1 ${activeModel === 'flash' ? 'text-indigo-900' : 'text-emerald-900'}`}>
                    {step.phase}
                  </h5>
                  <p className="text-slate-600 text-sm mb-3">{step.description}</p>
                  
                  {step.resources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {step.resources.map((res, rIdx) => (
                        <a 
                          key={rIdx} 
                          href={`https://www.google.com/search?q=${encodeURIComponent(res + " " + currentResult.recommendedRole)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs md:text-sm text-slate-600 font-medium transition-all group/link ${
                            activeModel === 'flash' 
                              ? 'hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700' 
                              : 'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {res}
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-current" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Results;
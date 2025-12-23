import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { extractTextFromPDF } from '../services/pdfService';

interface PDFUploadProps {
  onUpload: (text: string) => void;
  onSkip: () => void;
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onUpload, onSkip }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const text = await extractTextFromPDF(file);
      if (text.length < 50) {
        setError("ไม่สามารถอ่านข้อความจากไฟล์ได้ (อาจเป็นไฟล์สแกน)");
        setIsLoading(false);
        return;
      }
      onUpload(text);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอ่านไฟล์ PDF กรุณาลองใหม่');
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">เพิ่มข้อมูลรายวิชาที่เรียน</h2>
        <p className="text-slate-600">
          อัปโหลดไฟล์ PDF คำอธิบายรายวิชา (Syllabus) เพื่อให้ AI แนะนำได้แม่นยำขึ้นจากพื้นฐานที่คุณมี
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-3 border-dashed rounded-2xl p-12 mb-6 transition-all ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-105' 
            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
        }`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center animate-pulse">
            <FileText className="w-12 h-12 text-indigo-400 mb-4" />
            <p className="text-indigo-600 font-medium">กำลังอ่านข้อมูลจาก PDF...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-2">
              ลากไฟล์ PDF มาวางที่นี่
            </p>
            <p className="text-sm text-slate-500 mb-6">หรือคลิกเพื่อเลือกไฟล์</p>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              id="pdf-input"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <label
              htmlFor="pdf-input"
              className="inline-block bg-white border border-slate-200 hover:border-indigo-500 text-slate-700 px-6 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              เลือกไฟล์
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        onClick={onSkip}
        className="text-slate-400 hover:text-slate-600 text-sm font-medium underline underline-offset-4 decoration-slate-300"
      >
        ข้ามขั้นตอนนี้ (ใช้ผลลัพธ์จากแบบทดสอบอย่างเดียว)
      </button>
    </div>
  );
};

export default PDFUpload;
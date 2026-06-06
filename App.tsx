import React, { useState, useEffect } from 'react';
import { Language, AnalysisResult } from './types';
import { UI_TEXT } from './constants';
import { analyzeDocument } from './services/geminiService';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import LanguageSelector from './components/LanguageSelector';
import PharmacySearch from './components/PharmacySearch';
import CameraCapture from './components/CameraCapture';
import { Loader2, ShieldCheck, Stethoscope, Pill, ScanLine } from 'lucide-react';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.FA);
  const [mode, setMode] = useState<'scanner' | 'pharmacy'>('scanner');
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const texts = UI_TEXT[language];

  // Effect to handle RTL layout
  useEffect(() => {
    const isRtl = language === Language.FA || language === Language.KU;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);

    setLoading(true);
    try {
      const analysis = await analyzeDocument(selectedFile, language);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("processing_error");
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = (capturedFile: File) => {
    setShowCamera(false);
    handleFileSelect(capturedFile);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Top Banner (Developer Credit in Kurdish) */}
      <div className="bg-gradient-to-r from-blue-900 to-emerald-900 text-white text-center py-2 text-sm font-medium tracking-wide" dir="rtl">
        گەشەپێدەر و دروستکەری بەرنامەی ژیری دەستکرد: سەرهات
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-2 rounded-lg text-white shadow-sm">
              <Stethoscope size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-emerald-600 hidden sm:block">
              {texts.title}
            </h1>
          </div>
          <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
        </div>
      </header>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
          language={language}
        />
      )}

      {/* Main Content */}
      <main className="flex-grow container max-w-4xl mx-auto px-4 py-8">
        
        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl border border-blue-100 shadow-sm inline-flex">
            <button
              onClick={() => setMode('scanner')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                mode === 'scanner' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ScanLine size={18} />
              {texts.modes.scanner}
            </button>
            <button
              onClick={() => setMode('pharmacy')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                mode === 'pharmacy' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Pill size={18} />
              {texts.modes.pharmacy}
            </button>
          </div>
        </div>

        {/* PHARMACY MODE */}
        {mode === 'pharmacy' && (
           <PharmacySearch language={language} />
        )}

        {/* SCANNER MODE */}
        {mode === 'scanner' && (
          <>
            {/* Intro / Upload Section */}
            {!result && !loading && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{texts.title}</h2>
                  <p className="text-gray-500 max-w-lg mx-auto">
                    {texts.introDesc}
                  </p>
                </div>
                <FileUpload 
                  onFileSelect={handleFileSelect} 
                  onOpenCamera={() => setShowCamera(true)}
                  language={language} 
                />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                <h3 className="text-xl font-medium text-gray-700">{texts.analyzing}</h3>
                <p className="text-sm text-gray-500 mt-2">
                   {texts.loadingMsg}
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded shadow-sm">
                 <div className="flex items-center">
                    <div className="flex-shrink-0 text-red-500">
                       <ShieldCheck size={20} />
                    </div>
                    <div className="ml-3 mr-3">
                       <p className="text-sm text-red-700">{texts.errorGeneric}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => { setError(null); setFile(null); }}
                   className="mt-2 text-sm text-red-600 font-medium underline"
                 >
                   {texts.tryAgain}
                 </button>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="animate-fade-in">
                 <div className="mb-4 flex justify-between items-center">
                    <button 
                      onClick={() => { setResult(null); setFile(null); }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full transition-colors"
                    >
                      ← {texts.newScan}
                    </button>
                 </div>
                 <ResultDisplay result={result} language={language} originalImageSrc={filePreview} />
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer / Disclaimer */}
      <footer className="bg-slate-100 border-t border-slate-200 p-4 mt-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3 text-xs text-gray-500 leading-relaxed mb-4">
            <ShieldCheck className="flex-shrink-0 text-gray-400" size={16} />
            <p>{texts.disclaimer}</p>
          </div>
          
          <div className="text-center text-xs text-blue-800 font-medium opacity-80 border-t border-slate-200 pt-4">
             {texts.developer}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
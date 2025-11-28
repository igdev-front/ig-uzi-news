
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { NewsFeed } from './components/InputSection'; 
import { ScriptOutput } from './components/ScriptOutput';
import { NewsItem, ViralScript, Language } from './types';
import { generateViralScript } from './services/geminiService';
import { Zap, Settings, Globe } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentScript, setCurrentScript] = useState<ViralScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('PT');

  const translations = {
    PT: {
      subtitle: 'US WIRE • ATUALIZAÇÃO 12H',
      generatingTitle: 'CRIANDO PAUTA',
      generatingSub: 'Consultando Arquivos • Redigindo Roteiro',
      error: 'Sobrecarga no sistema. Falha ao gerar roteiro.',
    },
    EN: {
      subtitle: 'US WIRE • 12H UPDATE',
      generatingTitle: 'GENERATING STORY',
      generatingSub: 'Accessing Archives • Writing Script',
      error: 'System overload. Failed to generate script.',
    }
  };

  const t = translations[lang];

  const handleSelectNews = async (newsItem: NewsItem) => {
    setIsGenerating(true);
    setError(null);
    try {
      const script = await generateViralScript(newsItem, lang);
      setCurrentScript(script);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setCurrentScript(null);
    setError(null);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'PT' ? 'EN' : 'PT');
    handleReset(); // Reset to feed when changing language to reload correct news
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-500/30 font-sans">
      
      {/* Header - Matches Screenshot */}
      <header className="sticky top-0 z-50 bg-[#09090b] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            
            {/* Left: Logo & Meta */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
              <div className="bg-urgent-600 p-1.5 rounded-lg shadow-lg shadow-urgent-600/20 group-hover:bg-urgent-500 transition-colors">
                 <Zap className="h-5 w-5 text-white fill-current" />
              </div>
              <div className="flex flex-col justify-center">
                 <div className="font-black text-lg leading-none tracking-tight text-white group-hover:text-slate-200 transition-colors">
                    iG UZi <span className="text-urgent-500">News</span>
                 </div>
                 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-none mt-1">
                    {t.subtitle}
                 </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              
              <button 
                onClick={toggleLang}
                className="flex items-center gap-2 border border-slate-700 hover:border-brand-500 bg-slate-900 hover:bg-slate-800 transition-all rounded-md px-3 py-1.5 text-xs font-bold text-slate-300"
              >
                <Globe className="w-3 h-3" />
                {lang}
              </button>
            </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        
        {error && (
          <div className="max-w-5xl mx-auto mt-8 mb-8 bg-red-900/20 border border-red-500/50 text-red-200 p-6 rounded-xl flex items-start gap-3 font-mono text-sm">
             <span className="text-xl">⚠️</span> 
             <div>
               <p className="font-bold mb-1">ERRO DE SISTEMA / SYSTEM ERROR</p>
               <p>{error}</p>
             </div>
          </div>
        )}

        {isGenerating && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
             <div className="w-full max-w-md p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <Zap className="absolute inset-0 m-auto w-8 h-8 text-brand-500 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{t.generatingTitle}</h2>
                <p className="text-brand-400 font-mono text-sm animate-pulse">{t.generatingSub}</p>
             </div>
          </div>
        )}

        {!currentScript ? (
          <div className="max-w-5xl mx-auto px-4 py-8">
            <NewsFeed onSelectNews={handleSelectNews} isGenerating={isGenerating} lang={lang} />
          </div>
        ) : (
          <ScriptOutput script={currentScript} onReset={handleReset} lang={lang} />
        )}

      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
      </Routes>
    </Router>
  );
};

export default App;

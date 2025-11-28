
import React, { useEffect, useState } from 'react';
import { NewsItem, Language } from '../types';
import { fetchNewsFeed, getNextUpdateTime, getCacheKey } from '../services/geminiService';
import { Zap, AlertTriangle, RefreshCw, Newspaper, Flame, Sparkles, AlertCircle } from 'lucide-react';

interface NewsFeedProps {
  onSelectNews: (news: NewsItem) => void;
  isGenerating: boolean;
  lang: Language;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ onSelectNews, isGenerating, lang }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [activeTab, setActiveTab] = useState<'REAL' | 'FICTION'>('REAL');
  const [timeRemaining, setTimeRemaining] = useState<string>("--:--:--");

  const translations = {
    PT: {
      realNews: 'Notícias Reais',
      viralScenarios: 'Cenários Virais',
      todayHeadlines: 'MANCHETES DE HOJE',
      newBatch: 'Nova Pauta',
      urgent: 'URGENTE (DC)',
      fiction: 'FICÇÃO',
      produce: 'PRODUZIR',
      processing: 'PROCESSANDO...',
      script: 'ROTEIRO',
      noNews: 'Nenhuma notícia encontrada no momento. Verifique sua conexão ou tente recarregar.',
      retry: 'Recarregar Feed'
    },
    EN: {
      realNews: 'Real News',
      viralScenarios: 'Viral Scenarios',
      todayHeadlines: 'TODAY\'S HEADLINES',
      newBatch: 'New Batch',
      urgent: 'URGENT (DC)',
      fiction: 'FICTION',
      produce: 'PRODUCE',
      processing: 'PROCESSING...',
      script: 'SCRIPT',
      noNews: 'No news found at the moment. Check your connection or try reloading.',
      retry: 'Reload Feed'
    }
  };

  const t = translations[lang];

  const loadNews = async () => {
    setLoadingFeed(true);
    try {
      // The service now handles 12h caching logic internally
      const items = await fetchNewsFeed(lang);
      setNewsItems(items);
    } catch (e) {
      console.error(e);
      setNewsItems([]); // Ensure clear state on error
    } finally {
      setLoadingFeed(false);
    }
  };

  // Reload news when Language changes
  useEffect(() => {
    loadNews();
  }, [lang]);

  // Real-time Timer Logic
  useEffect(() => {
    const updateTimer = () => {
        const nextTime = getNextUpdateTime(lang);
        const now = Date.now();
        const diff = nextTime - now;

        if (diff <= 0) {
            setTimeRemaining("00:00:00");
        } else {
             const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
             const m = Math.floor((diff / (1000 * 60)) % 60);
             const s = Math.floor((diff / 1000) % 60);
             setTimeRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [lang, newsItems]); // Re-run when news updates (cache might be updated)

  const filteredNews = newsItems.filter(item => 
    activeTab === 'REAL' ? item.isReal : !item.isReal
  );

  const currentDate = new Date().toLocaleDateString(lang === 'PT' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  // Tomorrow's date for display
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  const displayDate = nextDate.toLocaleDateString(lang === 'PT' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleManualRefresh = () => {
     localStorage.removeItem(getCacheKey(lang));
     loadNews();
  };

  return (
    <div className="w-full space-y-6 animate-fade-in-up pb-20">
      
      {/* TABS */}
      <div className="flex w-full bg-dark-900 rounded-xl overflow-hidden border border-slate-800 p-1">
        <button
          onClick={() => setActiveTab('REAL')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 rounded-lg ${
            activeTab === 'REAL' 
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          {t.realNews}
        </button>
        <button
          onClick={() => setActiveTab('FICTION')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 rounded-lg ${
            activeTab === 'FICTION' 
              ? 'bg-urgent-600 text-white shadow-lg shadow-urgent-900/50' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {t.viralScenarios}
        </button>
      </div>

      {/* DATE INFO BAR */}
      <div className="bg-dark-900 rounded-xl border border-slate-800 p-4 flex flex-col md:flex-row justify-between items-center text-sm">
        <div className="flex items-center gap-3 mb-2 md:mb-0">
          <Flame className="w-5 h-5 text-blue-400" />
          <div>
            <span className="text-slate-500 uppercase font-bold text-xs block mb-0.5">{t.todayHeadlines} ({currentDate}):</span>
            <span className="text-white font-mono font-bold text-lg">{displayDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-400 font-mono text-xs">
             <span>{t.newBatch}:</span>
             <span className={`font-bold ${timeRemaining === '00:00:00' ? 'text-green-500' : 'text-brand-400'}`}>
                {timeRemaining === '00:00:00' ? 'READY' : timeRemaining}
             </span>
           </div>
           
           <button 
              onClick={handleManualRefresh}
              disabled={loadingFeed} 
              className="text-slate-600 hover:text-brand-400 transition-colors"
              title="Force Refresh (Dev)"
           >
              <RefreshCw className={`w-4 h-4 ${loadingFeed ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* NEWS LIST - Stacked Cards */}
      <div className="space-y-4">
        {loadingFeed ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-dark-900 rounded-xl animate-pulse border border-slate-800"></div>
          ))
        ) : filteredNews.length === 0 ? (
          <div className="bg-dark-900 rounded-xl border border-slate-800 p-12 text-center flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 mb-6 max-w-md">{t.noNews}</p>
            <button 
              onClick={handleManualRefresh}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> {t.retry}
            </button>
          </div>
        ) : (
          filteredNews.map((item) => (
            <div 
              key={item.id} 
              className={`relative bg-dark-900 rounded-xl overflow-hidden transition-all duration-300 group
                ${item.isHighlight 
                  ? 'border border-highlight-400/80 shadow-[0_0_20px_rgba(250,204,21,0.15)]' 
                  : 'border border-slate-800 hover:border-slate-600'
                }
              `}
            >
              {/* Highlight Badge */}
              {item.isHighlight && (
                 <div className="absolute top-0 right-0">
                    <div className="bg-highlight-400 text-black text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <TrendingUpIcon />
                      DESTAQUE
                    </div>
                 </div>
              )}

              <div className="p-5 md:p-6">
                {/* Top Meta Row */}
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-2">
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-bold uppercase px-2 py-1 rounded border border-slate-700">
                        {item.category === 'FICTION' ? t.fiction : item.category}
                      </span>
                      {item.isHighlight && item.isReal && (
                        <span className="bg-slate-800 text-slate-400 text-[10px] font-bold uppercase px-2 py-1 rounded border border-slate-700">
                           {t.urgent}
                        </span>
                      )}
                   </div>
                   
                   {!item.isHighlight && (
                     <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border border-slate-800 bg-slate-950 text-brand-400">
                        <Zap className="w-3 h-3 fill-current" />
                        {item.viralScore}%
                     </div>
                   )}
                   {item.isHighlight && (
                     <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border border-blue-900/50 bg-blue-950/30 text-brand-400 mt-6 md:mt-0 mr-16 md:mr-0">
                       <Zap className="w-3 h-3 fill-current" />
                       {item.viralScore}%
                     </div>
                   )}
                </div>

                {/* Main Content */}
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 leading-tight">
                  {item.headline}
                </h3>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed max-w-3xl">
                  {item.summary}
                </p>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 font-mono uppercase tracking-wider">
                      <span>1:20 MIN</span>
                      <span className="text-slate-700">•</span>
                      <span>{t.script}</span>
                   </div>

                   <button 
                     onClick={() => !isGenerating && onSelectNews(item)}
                     disabled={isGenerating}
                     className={`flex items-center gap-2 font-bold text-sm transition-colors
                       ${item.isHighlight ? 'text-brand-400 hover:text-brand-300' : 'text-brand-500 hover:text-brand-400'}
                     `}
                   >
                     {isGenerating ? t.processing : t.produce}
                     <Sparkles className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Simple Icon helper for internal use
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

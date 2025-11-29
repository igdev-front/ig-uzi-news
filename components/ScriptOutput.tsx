
import React, { useState } from 'react';
import { ViralScript, Language } from '../types';
import { Button } from './Button';
import { Copy, ArrowLeft, Clock, Monitor, Type, Activity, TrendingUp, Anchor, Heart, Languages } from 'lucide-react';

interface ScriptOutputProps {
  script: ViralScript;
  onReset: () => void;
  lang: Language;
}

export const ScriptOutput: React.FC<ScriptOutputProps> = ({ script, onReset, lang }) => {
  const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(32); // Font size for teleprompter
  const [translatePrompts, setTranslatePrompts] = useState(false); // Toggle state for prompt translation

  const translations = {
    PT: {
      back: 'Voltar ao Feed',
      teleprompter: 'TELEPROMPTER',
      scenes: 'LISTA DE CENAS',
      copyAll: 'Copiar Tudo',
      duration: 'Duração',
      words: 'Palavras',
      copied: 'COPIADO',
      fontSize: 'Tamanho do Texto',
      analysis: 'ANÁLISE VIRAL (IA)',
      score: 'PONTUAÇÃO',
      hook: 'GANCHO',
      retention: 'RETENÇÃO',
      trigger: 'GATILHO',
      translate: 'Traduzir',
      original: 'Original'
    },
    EN: {
      back: 'Back to Feed',
      teleprompter: 'TELEPROMPTER',
      scenes: 'SCENE LIST',
      copyAll: 'Copy All',
      duration: 'Duration',
      words: 'Words',
      copied: 'COPIED',
      fontSize: 'Text Size',
      analysis: 'VIRAL ANALYSIS (AI)',
      score: 'SCORE',
      hook: 'HOOK',
      retention: 'RETENTION',
      trigger: 'TRIGGER',
      translate: 'Translate',
      original: 'Original'
    }
  };

  const t = translations[lang];

  const copyPrompt = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 1500);
  };

  const copyAllPrompts = () => {
    // Always copy the ENGLISH prompts regardless of view mode, as that's what tools need
    const allText = script.scenes.map(s => s.prompt).join('\n\n');
    navigator.clipboard.writeText(allText);
    alert(lang === 'PT' ? "Prompts (Inglês) copiados!" : "Prompts (English) copied!");
  };

  // Safe check if analysis exists (for old scripts/types)
  const analysis = script.viralAnalysis || {
    score: 85,
    hookStrength: 'HIGH',
    retentionPrediction: 'HIGH',
    emotionalTrigger: 'Urgency',
    keyTrend: 'News'
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col animate-fade-in-up bg-[#020202] font-sans">
      
      {/* 1. STUDIO HEADER */}
      <div className="border-b border-white/10 bg-[#050505] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6 overflow-hidden">
          <button 
            onClick={onReset} 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4"/>
            {t.back}
          </button>
          
          <div className="h-6 w-px bg-white/10 hidden md:block"></div>

          <div className="min-w-0">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <h2 className="text-white font-bold truncate text-sm tracking-wide uppercase">{script.headline}</h2>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
             <span className="flex items-center gap-2"><Clock className="w-3 h-3"/> {script.estimatedDuration}</span>
             <span className="w-px h-3 bg-slate-800"></span>
             <span>{script.wordCount} {t.words}</span>
        </div>
      </div>

      {/* 2. SPLIT STUDIO LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT: TELEPROMPTER (High Tech / Minimalist) */}
        <div className="flex-1 lg:flex-[2] bg-[#020202] relative overflow-hidden flex flex-col group">
           
           {/* HUD / VIRAL ANALYSIS DASHBOARD - Placed ABOVE the text */}
           <div className="shrink-0 bg-[#08080a] border-b border-white/5 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 z-20">
              
              {/* Score Card */}
              <div className="bg-[#0e0e11] rounded p-3 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group/card">
                 <div className="absolute top-0 right-0 w-8 h-8 bg-brand-500/10 rounded-bl-xl"></div>
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.score}</span>
                 <div className={`text-3xl font-black ${getScoreColor(analysis.score)} flex items-center gap-1`}>
                    <Activity className="w-5 h-5 opacity-50" />
                    {analysis.score}
                 </div>
              </div>

              {/* Hook Strength */}
              <div className="bg-[#0e0e11] rounded p-3 border border-white/5 flex flex-col items-center justify-center">
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.hook}</span>
                 <div className="text-lg font-bold text-white flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-brand-400" />
                    {analysis.hookStrength}
                 </div>
              </div>

              {/* Retention */}
              <div className="bg-[#0e0e11] rounded p-3 border border-white/5 flex flex-col items-center justify-center">
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.retention}</span>
                 <div className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-highlight-400" />
                    {analysis.retentionPrediction}
                 </div>
              </div>

               {/* Emotional Trigger */}
               <div className="bg-[#0e0e11] rounded p-3 border border-white/5 flex flex-col items-center justify-center">
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.trigger}</span>
                 <div className="text-lg font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="truncate max-w-[100px]">{analysis.emotionalTrigger}</span>
                 </div>
              </div>
           </div>

           {/* Tech Overlay lines */}
           <div className="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-900/20 to-transparent pointer-events-none"></div>
           
           {/* Controls Bar (Floating) */}
           <div className="absolute top-24 right-8 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 flex items-center gap-3">
                <Type className="w-3 h-3 text-slate-400" />
                <input 
                  type="range" 
                  min="20" 
                  max="64" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-24 accent-brand-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
             </div>
             <Button variant="outline" onClick={() => navigator.clipboard.writeText(script.teleprompterText)} className="text-[10px] uppercase h-8 px-3 rounded-full border-white/20 hover:border-white/40">
                <Copy className="w-3 h-3 mr-2"/> COPY
             </Button>
           </div>

           {/* Prompter Content */}
           <div className="flex-1 overflow-y-auto px-8 lg:px-20 py-12 scroll-smooth scrollbar-hide relative z-10">
             <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-center">
                <p 
                  className="font-medium text-white/90 text-center transition-all duration-200"
                  style={{ 
                    fontSize: `${fontSize}px`, 
                    lineHeight: '1.5',
                    textShadow: '0 0 30px rgba(0,0,0,0.8)' 
                  }}
                >
                  {script.teleprompterText.split('\n').map((line, i) => (
                     <React.Fragment key={i}>
                       {line}
                       <br className="mb-6 block" />
                     </React.Fragment>
                  ))}
                </p>
             </div>
           </div>

           {/* Reading Guide Indicator (Central Line) */}
           <div className="absolute top-1/2 left-0 w-4 h-[2px] bg-brand-500/50 rounded-r z-20 pointer-events-none"></div>
           <div className="absolute top-1/2 right-0 w-4 h-[2px] bg-brand-500/50 rounded-l z-20 pointer-events-none"></div>
        </div>

        {/* RIGHT: SCENES (Utility Area) */}
        <div className="flex-1 lg:flex-[1] bg-[#050505] flex flex-col border-l border-white/5">
          
          <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-[#050505] sticky top-0 z-10 gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Monitor className="w-3 h-3" />
              {t.scenes}
            </span>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTranslatePrompts(!translatePrompts)}
                className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider px-2 py-1 rounded transition-colors
                  ${translatePrompts 
                    ? 'text-white bg-slate-700' 
                    : 'text-slate-500 hover:text-white bg-transparent'
                  }`}
                title={translatePrompts ? "Show Original (English)" : "Show Translation (PT)"}
              >
                <Languages className="w-3 h-3" />
                {translatePrompts ? 'PT' : 'EN'}
              </button>
              
              <button 
                onClick={copyAllPrompts}
                className="text-[10px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 uppercase tracking-wider bg-brand-500/10 px-2 py-1 rounded transition-colors"
              >
                <Copy className="w-3 h-3"/> {t.copyAll}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#08080a]">
             {script.scenes.map((scene) => (
               <div 
                 key={scene.id} 
                 className="bg-[#0f0f11] border border-white/5 rounded p-3 hover:border-white/20 transition-all group relative"
               >
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-600 font-bold">
                        {String(scene.id).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] font-bold text-slate-300 uppercase truncate max-w-[150px] tracking-wide">
                        {scene.description}
                      </span>
                   </div>
                   <button 
                      // Always copy the ENGLISH prompt
                      onClick={() => copyPrompt(scene.prompt, scene.id)}
                      className="text-slate-600 hover:text-white transition-colors"
                   >
                      {copiedPromptId === scene.id 
                        ? <span className="text-[10px] font-bold text-green-500">{t.copied}</span> 
                        : <Copy className="w-3 h-3" />
                      }
                   </button>
                 </div>
                 
                 <div className="rounded p-2 border border-white/5 bg-black/20">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                      {/* Toggle between Translated and Original Prompt */}
                      <span className="text-slate-300/80 selection:bg-brand-500/30">
                        {(translatePrompts && scene.prompt_pt) ? scene.prompt_pt : scene.prompt}
                      </span>
                    </p>
                 </div>
               </div>
             ))}
             <div className="h-10"></div>
          </div>

        </div>

      </div>
    </div>
  );
};
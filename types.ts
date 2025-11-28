
export type NewsCategory = 'POLITICS' | 'ECONOMY' | 'DISASTER' | 'FICTION' | 'TECH';
export type Language = 'PT' | 'EN';

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  viralScore: number;
  category: NewsCategory;
  isReal: boolean; // true = USA Real, false = Viral Fiction
  date: string;
  isHighlight?: boolean; // For "DESTAQUE" visual
}

export interface ViralAnalysis {
  score: number; // 0-100
  hookStrength: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  retentionPrediction: 'HIGH' | 'MEDIUM' | 'LOW';
  emotionalTrigger: string; // e.g. "Fear", "Curiosity"
  keyTrend: string; // e.g. "Economy", "War"
}

export interface ViralScript {
  newsId: string;
  headline: string;
  teleprompterText: string; // The full 1:20 min text
  scenes: ImagePrompt[];
  estimatedDuration: string;
  wordCount: number;
  viralAnalysis: ViralAnalysis;
}

export interface ImagePrompt {
  id: number;
  description: string; // Internal description
  prompt: string; // Optimised for Midjourney/Leonardo
}

export interface GeneratorFormData {
  selectedNews: NewsItem;
}

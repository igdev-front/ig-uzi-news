import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NewsItem, ViralScript, Language } from "../types";

// Safe API Key Access to prevent crashes if process is undefined
const getApiKey = (): string => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore reference errors
  }
  return '';
};

// API KEYS
const GNEWS_API_KEY = "84423fc4f35e5fc6615e22b416491858";
const NEWSAPI_KEY = "8596f19c66b84825918bfcf5eeab6c83";

// URLS
const GNEWS_URL = `https://gnews.io/api/v4/top-headlines?category=general&lang=en&country=us&max=10&apikey=${GNEWS_API_KEY}`;
const NEWSAPI_URL = `https://newsapi.org/v2/top-headlines?country=us&pageSize=20&apiKey=${NEWSAPI_KEY}`;

// --- LOCAL STORAGE CACHE CONFIG ---
export const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 Hours
export const CACHE_VERSION = 'v8'; // Bump version to force refresh on deploy

export const getCacheKey = (lang: Language) => `ig_uzi_news_${CACHE_VERSION}_cache_${lang}`;

interface CacheData {
  timestamp: number;
  data: NewsItem[];
}

// Fallback Data for Localhost/Error states
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'fallback-1',
    headline: 'TIROTEIO NA CASA BRANCA: Washington em Lockdown Total',
    summary: 'A capital americana entra em estado de sítio após múltiplos disparos reportados no perímetro norte da residência presidencial. Guarda Nacional acionada.',
    viralScore: 99,
    category: 'POLITICS',
    isReal: true,
    date: 'Hoje',
    isHighlight: true
  },
  {
    id: 'fallback-2',
    headline: 'CALIFÓRNIA AFUNDANDO: A Falha de San Andreas Acordou',
    summary: 'Sismólogos registram tremor histórico de 8.2 na escala Richter. Especialistas alertam que o "Big One" pode ter começado agora.',
    viralScore: 97,
    category: 'DISASTER',
    isReal: true,
    date: 'Hoje'
  },
  {
    id: 'fallback-3',
    headline: 'O FIM DO DÓLAR: China e Rússia Lançam Nova Moeda Global',
    summary: 'Em movimento surpresa, potências orientais desvinculam suas economias do dólar americano, causando pânico em Wall Street.',
    viralScore: 95,
    category: 'ECONOMY',
    isReal: true,
    date: 'Hoje'
  },
  {
    id: 'fallback-4',
    headline: 'INVASÃO SILENCIOSA: O Sinal Veio do Fundo do Mar',
    summary: 'Marinha dos EUA detecta estrutura gigantesca se movendo no Pacífico. O Pentágono se recusa a comentar, mas frotas estão se movendo.',
    viralScore: 98,
    category: 'FICTION',
    isReal: false,
    date: 'Hoje'
  },
  {
    id: 'fallback-5',
    headline: 'APAGÃO DIGITAL: Internet Global Desligada em 24h?',
    summary: 'Grupo hacker desconhecido reivindica controle dos cabos submarinos e ameaça resetar a rede mundial se exigências não forem cumpridas.',
    viralScore: 94,
    category: 'FICTION',
    isReal: false,
    date: 'Hoje'
  }
];

// Helper to get the timestamp when the next batch is available
export const getNextUpdateTime = (lang: Language): number => {
  const key = getCacheKey(lang);
  const cachedRaw = localStorage.getItem(key);
  if (!cachedRaw) return 0; // No cache, ready immediately
  try {
    const cached: CacheData = JSON.parse(cachedRaw);
    return cached.timestamp + CACHE_DURATION_MS;
  } catch (e) {
    return 0;
  }
};

// Schema for the News Feed
const newsFeedSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    news: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING, description: "Shocking or urgent headline" },
          summary: { type: Type.STRING, description: "2 sentence context" },
          viralScore: { type: Type.NUMBER, description: "Score from 80 to 99" },
          category: { type: Type.STRING, enum: ['POLITICS', 'ECONOMY', 'DISASTER', 'FICTION', 'TECH'] },
          isReal: { type: Type.BOOLEAN, description: "True for US News, False for Hypothetical scenarios" }
        },
        required: ["headline", "summary", "viralScore", "category", "isReal"]
      }
    }
  },
  required: ["news"]
};

// Schema for the Script Output with Analysis
const scriptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    teleprompterText: { 
      type: Type.STRING, 
      description: "A continuous 250+ word script formatted for reading. No scene markers in text. Just the speech." 
    },
    scenes: {
      type: Type.ARRAY,
      description: "Exactly 20 image prompts corresponding to the flow of the script",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          description: { type: Type.STRING, description: "Brief visual description for the editor" },
          prompt: { type: Type.STRING, description: "High fidelity English prompt for ImageFX. Style: Casual Photo, Realism, 8K. NO ANIMATION. NO CINEMATIC." },
          prompt_pt: { type: Type.STRING, description: "Portuguese translation of the prompt for reference." }
        },
        required: ["id", "description", "prompt", "prompt_pt"]
      }
    },
    viralAnalysis: {
      type: Type.OBJECT,
      description: "Analysis of the script's viral potential",
      properties: {
        score: { type: Type.NUMBER, description: "0-100 Viral Potential Score based on hook and topic" },
        hookStrength: { type: Type.STRING, enum: ['EXTREME', 'HIGH', 'MEDIUM', 'LOW'] },
        retentionPrediction: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
        emotionalTrigger: { type: Type.STRING, description: "Primary emotion (e.g., Fear, Outrage, Hope, Curiosity)" },
        keyTrend: { type: Type.STRING, description: "The main trend this piggybacks on" }
      },
      required: ["score", "hookStrength", "retentionPrediction", "emotionalTrigger", "keyTrend"]
    },
    wordCount: { type: Type.INTEGER }
  },
  required: ["teleprompterText", "scenes", "viralAnalysis", "wordCount"]
};

// Helper to fetch real news from GNews
async function fetchGNewsArticles() {
  try {
    console.log("Fetching GNews...");
    const response = await fetch(GNEWS_URL);
    if (!response.ok) throw new Error(`GNews API error: ${response.status}`);
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.warn("Failed to fetch from GNews:", error);
    return [];
  }
}

// Helper to fetch from NewsAPI with CORS Proxy fallback
async function fetchNewsAPIArticles() {
  try {
    console.log("Fetching NewsAPI.org (Direct)...");
    const response = await fetch(NEWSAPI_URL);
    if (!response.ok) {
       // If direct fetch fails (likely CORS on Vercel), try Proxy
       throw new Error(`NewsAPI Direct error: ${response.status}`);
    }
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.warn("Direct fetch failed, trying Proxy...", error);
    try {
       // Use allorigins as a simple CORS proxy
       const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(NEWSAPI_URL)}`;
       const response = await fetch(proxyUrl);
       if (!response.ok) throw new Error("Proxy failed");
       const data = await response.json();
       return data.articles || [];
    } catch (proxyError) {
       console.warn("Proxy fetch failed:", proxyError);
       return [];
    }
  }
}

export const fetchNewsFeed = async (lang: Language): Promise<NewsItem[]> => {
  const model = "gemini-2.5-flash";
  const CACHE_KEY = getCacheKey(lang);

  const apiKey = getApiKey();
  
  // Check if API Key is configured
  if (!apiKey) {
    console.error("Gemini API Key is missing! Check your Vercel Environment Variables.");
    // We don't throw here for the Feed, we return Fallback so the site isn't blank
    return FALLBACK_NEWS.map(item => ({
        ...item,
        date: new Date().toLocaleDateString(lang === 'PT' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' }),
    }));
  }

  // Initialize GenAI here to avoid module-level crashes
  const genAI = new GoogleGenAI({ apiKey });

  // 1. Check Cache
  const cachedRaw = localStorage.getItem(CACHE_KEY);
  if (cachedRaw) {
    const cached: CacheData = JSON.parse(cachedRaw);
    const now = Date.now();
    
    // If cache is valid (less than 12 hours old)
    if (now - cached.timestamp < CACHE_DURATION_MS) {
      console.log("Loading news from 12h cache...");
      return cached.data;
    }
  }

  // 2. Fetch Fresh Data (Parallel fetch from both APIs)
  let allArticles: any[] = [];
  try {
      const [gNewsArticles, newsApiArticles] = await Promise.all([
        fetchGNewsArticles(),
        fetchNewsAPIArticles()
      ]);
      allArticles = [...gNewsArticles, ...newsApiArticles];
  } catch (e) {
      console.warn("Both APIs failed or network issue", e);
  }
  
  const langPrompt = lang === 'PT' 
    ? 'Output everything in Brazilian Portuguese (Headlines and Summaries).' 
    : 'Output everything in English.';

  let sourceMaterialPrompt = "";
  if (allArticles.length > 0) {
    // Include timestamp for freshness context
    const articlesText = allArticles.slice(0, 30).map((a: any, i: number) => 
      `Article ${i+1} [${a.source?.name}]: "${a.title}"
       Date: ${a.publishedAt}
       Content: ${a.description || ''}`
    ).join('\n\n');

    sourceMaterialPrompt = `
      I have fetched the following REAL-TIME US NEWS from GNews and NewsAPI:
      ${articlesText}

      INSTRUCTIONS FOR "REAL" NEWS (PRIORITY: VIRAL & TRENDING):
      1. ANALYZE the articles above and identify the top stories that are "EXPLODING" or "BOOMING" right now in the US.
      2. Look for keywords: "Crisis", "Record", "War", "Scandal", "Breaking", "Emergency", "Trump", "Biden", "Market Crash".
      3. DISCARD boring news. Only keep what will make a viewer stop scrolling on TikTok.
      4. SELECT THE TOP 8 to 10 MOST IMPACTFUL STORIES.
      5. REWRITE the headlines to be EXTREMELY CLICKBAITY but FACTUALLY BASED on the API data.
      6. Set "isReal" to true.
      7. Viral Score must be high (94-99) for these trending items.
    `;
  } else {
    sourceMaterialPrompt = `
      (API FETCH FAILED - FALLBACK MODE)
      Generate 10 "REAL" news items based on the ABSOLUTE LATEST high-stakes UNITED STATES topics (e.g. Current Election drama, Inflation Spikes, Global Conflict involving US).
      Make them feel like "Breaking News" happening this second.
      Set "isReal" to true.
    `;
  }

  const prompt = `
    Act as iG UZi, an elite News Director and viral content strategist for US Creators.
    
    ${sourceMaterialPrompt}

    INSTRUCTIONS FOR "FICTION" NEWS (VIRAL SCENARIOS):
    - Generate 6 additional "FICTION" items.
    - These are "What If" scenarios or Conspiracies (e.g. "Yellowstone Eruption Imminent", "Dollar Replaced by Crypto", "Alien Signal Confirmed").
    - These must be terrifying or awe-inspiring.
    - Set "isReal" to false.
    - Set Category to 'FICTION'.
    
    GENERAL RULES:
    - ${langPrompt}
    - Headlines must be short, punchy, and upper-case friendly.
    - Sort REAL news by "Viral Potential" (Most shocking first).
    - Total output: ~15 items (Mix of Real Trending + Fiction).
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: newsFeedSchema,
        temperature: 0.8,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Add IDs and dates locally
      const enhancedData = data.news.map((item: any, index: number) => ({
        ...item,
        id: `news-${Date.now()}-${index}`,
        date: new Date().toLocaleDateString(lang === 'PT' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' }),
        // Mark the first Real news and first Fiction news as highlight
        isHighlight: index === 0 || (item.category === 'FICTION' && !data.news[index-1]?.isReal && data.news[index-1]?.category !== 'FICTION')
      }));

      // Save to Cache
      const cachePayload: CacheData = {
        timestamp: Date.now(),
        data: enhancedData
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

      return enhancedData;
    }
    throw new Error("Failed to generate news feed");
  } catch (error) {
    console.error("News Feed Error (Using Fallback):", error);
    // FALLBACK: Return static data if API/AI fails (e.g. on localhost without keys)
    const fallbackWithDate = FALLBACK_NEWS.map(item => ({
        ...item,
        headline: lang === 'EN' && item.headline.includes('TIROTEIO') ? "SHOOTING AT WHITE HOUSE: Washington in Lockdown" : item.headline, // Simple mock translation for fallback
        date: new Date().toLocaleDateString(lang === 'PT' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' }),
    }));
    return fallbackWithDate;
  }
};

export const generateViralScript = async (newsItem: NewsItem, lang: Language): Promise<ViralScript> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(lang === 'PT' 
      ? "ERRO: Chave da API não configurada. Configure a variável 'API_KEY' no Vercel."
      : "ERROR: API Key missing. Please set 'API_KEY' in Vercel Environment Variables.");
  }

  // Initialize GenAI locally
  const genAI = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash";
  
  const langInstruction = lang === 'PT' 
    ? 'WRITE THE SCRIPT IN BRAZILIAN PORTUGUESE. Keep prompts in English.' 
    : 'WRITE THE SCRIPT IN ENGLISH. Keep prompts in English.';

  const openingInstruction = lang === 'PT'
    ? 'MUST START WITH A PHRASE LIKE "BREAKING NEWS", "URGENTE", "ATENÇÃO", OR "PLANTÃO URGENTE".'
    : 'MUST START WITH A PHRASE LIKE "BREAKING NEWS", "URGENT UPDATE", "JUST IN", OR "ALERT".';

  const prompt = `
    ACT AS A WORLD-CLASS DOCUMENTARY SCREENWRITER AND ART DIRECTOR.
    
    SOURCE MATERIAL:
    Headline: "${newsItem.headline}"
    Context: "${newsItem.summary}"
    Type: ${newsItem.isReal ? "REAL US NEWS (TRENDING)" : "FICTIONAL HYPOTHETICAL USA SCENARIO"}

    TASK:
    1. WRITE A VIRAL SCRIPT (1 Minute 20 Seconds).
       - ${langInstruction}
       - ${openingInstruction}
       - Minimum 220 words.
       - Style: Teleprompter (Continuous text, easy to read aloud).
       - Tone: Urgent, Dramatic, Investigative, "The Truth They Hide".
       - FOCUS: UNITED STATES OF AMERICA.
       - Structure: 
         * HOOK (0-5s): SHOCKING OPENER ("BREAKING NEWS...").
         * CONTEXT (5-30s): What is happening right now in the US?
         * THE TWIST (30-60s): Why this matters to every American/World.
         * IMPACT (60-80s): Final warning or call to action.
    
    2. GENERATE 20 ART PROMPTS (OPTIMIZED FOR IMAGE FX).
       - Create exactly 20 distinct image prompts.
       - "prompt": Must be in English (regardless of script language).
       - "prompt_pt": Provide a Portuguese translation of the prompt for the user.
       - STYLE: CASUAL PHOTOGRAPHY, REALISM, 8K, RAW FOOTAGE.
       - NEGATIVE CONSTRAINTS: NO Animation, NO Cinematic filters, NO 3D render style, NO Cartoons.
       - The images must look like they were taken by a witness in the USA with a high-end smartphone or a photojournalist.
       - Keywords to use: "Casual photo", "Amateur photography", "Candid shot", "News footage", "4k", "Raw style", "Authentic", "USA location".

    3. PERFORM A VIRAL ANALYSIS.
       - Analyze the script you just wrote.
       - Score it from 0-100 on viral potential.
       - Evaluate Hook Strength and Retention.
       - Identify the Emotional Trigger.

    OUTPUT JSON ONLY.
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scriptSchema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        newsId: newsItem.id,
        headline: newsItem.headline,
        estimatedDuration: "1:20",
      } as ViralScript;
    }
    throw new Error("No script generated");
  } catch (error) {
    console.error("Script Gen Error:", error);
    throw error;
  }
};
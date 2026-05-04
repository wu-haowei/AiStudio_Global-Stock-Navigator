import { GoogleGenAI } from "@google/genai";

export interface StockAnalysisResponse {
  text: string;
  sources: string[];
}

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    // In Vite, process.env is replaced during build via 'define' in vite.config.ts
    // In local dev or GitHub Actions, we use the VITE_ prefix
    const apiKey = (process.env.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("找不到 API Key。");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function getStockAnalysis(prompt: string): Promise<StockAnalysisResponse> {
  const client = getAI();
  
  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash", // User requested this specific model
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [
          {
            googleSearch: {},
          },
        ],
      },
    });

    const text = response.text || "No analysis generated.";
    
    // Extract sources from grounding metadata
    let sources: string[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks;
    
    if (chunks) {
      sources = chunks
        .filter(chunk => chunk.web && chunk.web.uri)
        .map(chunk => chunk.web!.uri!);
    }

    return {
      text,
      sources,
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

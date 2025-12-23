import { GoogleGenAI, Type } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
export const getPersonalityAnalysis = async (answers: string[]) => {
  const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: "Analise: " + answers.join(", ") });
  return JSON.parse(response.text || '{}');
};
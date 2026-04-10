import { GoogleGenAI } from "@google/genai";

const globalForGoogle = globalThis as unknown as {
  googleAI: GoogleGenAI | undefined;
};

export const googleAI =
  globalForGoogle.googleAI ??
  new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY || "",
  });

if (process.env.NODE_ENV !== "production")
  globalForGoogle.googleAI = googleAI;

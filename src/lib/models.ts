export type Provider = "lovable" | "google" | "openai";

export const LOVABLE_MODELS = [
  { id: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash (সবচেয়ে আধুনিক ও দ্রুত)" },
  { id: "google/gemini-1.5-flash", label: "Gemini 1.5 Flash (স্থিতিশীল)" },
  { id: "google/gemini-1.5-pro", label: "Gemini 1.5 Pro (গভীর গবেষণা)" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
];

export const GOOGLE_MODELS = [
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (অফিসিয়াল ও নির্ভরযোগ্য)" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (দ্রুততম)" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (উচ্চতর ক্ষমতা)" },
];

export const OPENAI_MODELS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
];

export const DEFAULT_MODELS: Record<Provider, string> = {
  lovable: "google/gemini-2.0-flash",
  google: "gemini-1.5-flash",
  openai: "gpt-4o",
};

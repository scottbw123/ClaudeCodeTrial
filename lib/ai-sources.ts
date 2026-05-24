export const AI_SOURCES = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "perplexity.ai",
  "perplexity.com",
  "copilot.microsoft.com",
  "bing.com",
  "you.com",
  "deepseek.com",
  "phind.com",
  "kagi.com",
  "monica.im",
  "duckassist.duckduckgo.com",
  "meta.ai",
  "poe.com",
  "x.ai",
  "grok.com",
];

export const AI_SOURCE_COLORS: Record<string, string> = {
  "chatgpt.com": "#1d4ed8",
  "chat.openai.com": "#1d4ed8",
  "claude.ai": "#06b6d4",
  "gemini.google.com": "#ec4899",
  "perplexity.ai": "#f97316",
  "perplexity.com": "#f97316",
  "copilot.microsoft.com": "#10b981",
  "bing.com": "#10b981",
  "you.com": "#a855f7",
  "deepseek.com": "#0ea5e9",
  "phind.com": "#84cc16",
  "kagi.com": "#facc15",
  "monica.im": "#f43f5e",
  "duckassist.duckduckgo.com": "#fb923c",
  "meta.ai": "#3b82f6",
  "poe.com": "#a78bfa",
  "x.ai": "#0f172a",
  "grok.com": "#475569",
};

export function colorForAiSource(source: string): string {
  return AI_SOURCE_COLORS[source.toLowerCase()] ?? "#9ca3af";
}

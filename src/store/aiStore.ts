import { create } from 'zustand';

export type AiProvider = 'openai' | 'gemini';
export type AiModel = string;

interface AiState {
  provider: AiProvider;
  apiKey: string;
  model: AiModel;
  isConfigured: boolean;
  isSettingsOpen: boolean;
  setProvider: (provider: AiProvider) => void;
  setApiKey: (key: string) => void;
  setModel: (model: AiModel) => void;
  openSettings: () => void;
  closeSettings: () => void;
  clearKey: () => void;
}

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
};

export const useAiStore = create<AiState>((set, get) => ({
  provider: 'gemini',
  apiKey: '',
  model: DEFAULT_MODELS['gemini'],
  isConfigured: false,
  isSettingsOpen: false,
  setProvider: (provider) =>
    set({ provider, model: DEFAULT_MODELS[provider] }),
  setApiKey: (apiKey) =>
    set({ apiKey, isConfigured: apiKey.length > 0 }),
  setModel: (model) => set({ model }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  clearKey: () => set({ apiKey: '', isConfigured: false }),
}));

// ---- AI Call Utility ----

interface AiCallOptions {
  systemPrompt: string;
  userPrompt: string;
}

export async function callAi({ systemPrompt, userPrompt }: AiCallOptions): Promise<string> {
  const { provider, apiKey, model } = useAiStore.getState();

  if (!apiKey) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  throw new Error('Unknown provider');
}

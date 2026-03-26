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
  gemini: 'gemini-2.5-flash',
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

interface ProviderErrorMeta {
  message: string;
  code: string;
}

function extractErrorMeta(err: any): ProviderErrorMeta {
  return (
    {
      message:
        err?.error?.message ||
        err?.message ||
        err?.details?.[0]?.message ||
        '',
      code:
        err?.error?.code ||
        err?.error?.status ||
        err?.code ||
        err?.status ||
        '',
    }
  );
}

function normalizeAiError(provider: AiProvider, status: number, rawMessage: string, code = ''): string {
  const msg = String(rawMessage ?? '').toLowerCase();
  const errCode = String(code ?? '').toLowerCase();

  if (status === 401 || msg.includes('api key not valid') || msg.includes('invalid api key')) {
    return `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API key is invalid. Please verify your key in AI Settings.`;
  }

  if (status === 403 || msg.includes('permission')) {
    return `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} request was blocked by permissions. Check key access and project configuration.`;
  }

  if (status === 429 || msg.includes('quota exceeded') || msg.includes('rate limit') || errCode.includes('resource_exhausted')) {
    const retryMatch = rawMessage.match(/retry in\s+([0-9.]+)s/i);
    const retryHint = retryMatch ? ` Retry in ~${Math.ceil(Number(retryMatch[1]))}s.` : '';

    if (errCode.includes('insufficient_quota') || msg.includes('insufficient_quota')) {
      return `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} account quota/billing limit is exhausted.${retryHint} Check your provider billing and quota settings.`;
    }

    if (errCode.includes('rate_limit') || msg.includes('rate limit')) {
      return `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} rate limit is temporarily reached.${retryHint} Try again shortly or switch to a lighter model.`;
    }

    if (provider === 'gemini') {
      return `Gemini request limit is temporarily reached.${retryHint} Try again shortly, or switch model/provider.`;
    }

    return `OpenAI request limit is temporarily reached.${retryHint} Try again shortly, or use a lower-cost model.`;
  }

  if (status >= 500) {
    return `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} service is temporarily unavailable. Please try again shortly.`;
  }

  return rawMessage || `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API error (${status}).`;
}

export async function callAi({ systemPrompt, userPrompt }: AiCallOptions): Promise<string> {
  const { provider, apiKey, model } = useAiStore.getState();
  const normalizedApiKey = apiKey.trim();

  if (!normalizedApiKey) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalizedApiKey}`,
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
      const { message, code } = extractErrorMeta(err);
      throw new Error(normalizeAiError('openai', res.status, message, code));
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  if (provider === 'gemini') {
    const callGeminiModel = async (modelName: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${normalizedApiKey}`;
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
        }),
      });
    };

    let res = await callGeminiModel(model);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const { message, code } = extractErrorMeta(err);
      throw new Error(normalizeAiError('gemini', res.status, message, code));
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  throw new Error('Unknown provider');
}

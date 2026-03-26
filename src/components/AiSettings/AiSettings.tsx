import { useState } from 'react';
import { X, Shield, Eye, EyeOff, Sparkles, Trash2, Info } from 'lucide-react';
import { useAiStore, type AiProvider } from '../../store/aiStore';
import './AiSettings.css';

const MODELS: Record<AiProvider, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
    { value: 'gpt-4o', label: 'GPT-4o (Best Quality)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Legacy)' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fast)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Fastest)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Best Quality)' },
  ],
};

export function AiSettings() {
  const {
    provider, apiKey, model, isConfigured, isSettingsOpen,
    setProvider, setApiKey, setModel, closeSettings, clearKey,
  } = useAiStore();

  const [showKey, setShowKey] = useState(false);

  if (!isSettingsOpen) return null;

  return (
    <div className="ai-settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}>
      <div className="ai-settings-modal">
        {/* Header */}
        <div className="ai-settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
            <h2>AI Configuration</h2>
          </div>
          <button className="btn-icon" onClick={closeSettings} style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="ai-settings-body">
          {/* Security Notice */}
          <div className="ai-notice info">
            <Shield size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Your key is never stored or transmitted to us.</strong>
              <br />
              It stays in browser memory only for this session. When you close the tab, it's gone.
              API calls go directly from your browser to the provider (OpenAI/Google).
            </div>
          </div>

          {/* Provider Selection */}
          <div style={{ marginTop: '20px' }}>
            <label className="form-label">AI Provider</label>
            <div className="provider-cards">
              <div
                className={`provider-card ${provider === 'gemini' ? 'active' : ''}`}
                onClick={() => setProvider('gemini')}
              >
                <div className="provider-card-name">Google Gemini</div>
                <div className="provider-card-desc">Free tier available</div>
              </div>
              <div
                className={`provider-card ${provider === 'openai' ? 'active' : ''}`}
                onClick={() => setProvider('openai')}
              >
                <div className="provider-card-name">OpenAI</div>
                <div className="provider-card-desc">GPT-4o / GPT-4o Mini</div>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="form-group">
            <label className="form-label">Model</label>
            <select
              className="form-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS[provider].map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div className="form-group">
            <label className="form-label">
              API Key
              <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)', marginLeft: '6px' }}>
                — {provider === 'gemini' ? 'Get from aistudio.google.com' : 'Get from platform.openai.com'}
              </span>
            </label>
            <div className="key-input-wrapper">
              <input
                className="form-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                className="key-toggle-btn"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                {showKey ? ' Hide' : ' Show'}
              </button>
            </div>
          </div>

          {/* Cost Notice */}
          <div className="ai-notice warning">
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>You pay only for what you use.</strong>
              <br />
              API calls are billed by your provider. Gemini offers a generous free tier.
              GPT-4o Mini costs ~$0.15 per 1M input tokens. Typical usage: pennies per day.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ai-settings-footer">
          <div>
            {isConfigured ? (
              <span className="ai-badge configured">
                <Sparkles size={12} /> AI Active
              </span>
            ) : (
              <span className="ai-badge not-configured">
                AI Inactive
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isConfigured && (
              <button className="btn btn-sm btn-ghost" onClick={clearKey} style={{ color: 'var(--color-danger)' }}>
                <Trash2 size={14} /> Clear Key
              </button>
            )}
            <button className="btn btn-sm btn-primary" onClick={closeSettings}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

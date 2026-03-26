import { useState } from 'react';
import { Plus, X, GripVertical, CheckCircle, Wand2, Loader2 } from 'lucide-react';
import { useChecklistStore } from '../../store/checklistStore';
import { useAiStore, callAi } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import type { ChecklistType } from '../../types';
import '../pages.css';

const TYPES: ChecklistType[] = ['Smoke', 'Sanity', 'Regression', 'Playwright Automation', 'API Test Points'];

export function ChecklistBuilder() {
  const { items, activeType, loadTemplate, addItem, removeItem, toggleItem } = useChecklistStore();
  const isAiConfigured = useAiStore((s) => s.isConfigured);
  const openSettings = useAiStore((s) => s.openSettings);
  const addToast = useToastStore((s) => s.addToast);
  const [newItemText, setNewItemText] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    addItem(newItemText.trim());
    setNewItemText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddItem();
  };

  const handleAiGenerate = async () => {
    if (!featureDesc.trim()) {
      addToast({ type: 'warning', title: 'Feature description required', message: 'Describe the feature to generate a custom checklist.' });
      return;
    }
    if (!isAiConfigured) {
      openSettings();
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await callAi({
        systemPrompt: `You are a senior QA engineer. Given a feature description and checklist type, generate a comprehensive ${activeType} testing checklist. Return ONLY a JSON array of strings — each string is one checklist item. Generate 10-15 specific, actionable items relevant to the feature. No explanations, no markdown, just the JSON array.`,
        userPrompt: `Feature: ${featureDesc}\n\nGenerate a ${activeType} checklist for this feature.`,
      });

      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((text: string) => {
          if (typeof text === 'string' && text.trim()) {
            addItem(text.trim());
          }
        });
        addToast({ type: 'success', title: `${parsed.length} AI checklist items added`, message: `Custom ${activeType} checklist generated from your feature description.` });
      }
    } catch (err: any) {
      if (err.message === 'AI_NOT_CONFIGURED') {
        openSettings();
      } else {
        addToast({ type: 'error', title: 'AI generation failed', message: err.message || 'Check your API key and try again.' });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Checklist Builder</h1>
        <p className="page-subtitle">
          Generate smoke, sanity, and regression checklists from templates or AI. Track progress before every release.
        </p>
      </div>

      <div className="grid-2">
        {/* Input Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Configuration</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Feature Description</label>
            <textarea
              className="form-textarea"
              value={featureDesc}
              onChange={(e) => setFeatureDesc(e.target.value)}
              placeholder="Describe the feature being tested, e.g., User authentication module with email/password login, social login, OAuth, and password reset flow with email verification."
              rows={4}
              id="checklist-feature"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Checklist Template</label>
            <select
              className="form-select"
              value={activeType}
              onChange={(e) => {
                const type = e.target.value as ChecklistType;
                useChecklistStore.getState().setActiveType(type);
              }}
              id="checklist-type"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => loadTemplate(activeType)} id="load-template-btn">
              <CheckCircle size={16} />
              Load Template
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleAiGenerate}
              disabled={isAiLoading}
              style={isAiConfigured ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
            >
              {isAiLoading
                ? <><Loader2 size={16} className="spin-icon" /> Generating...</>
                : <><Wand2 size={16} /> AI Generate</>
              }
            </button>
          </div>

          <div className="inline-add">
            <input
              className="form-input"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a custom checklist item..."
              id="add-checklist-item"
            />
            <button className="btn btn-secondary" onClick={handleAddItem}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Checklist Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Checklist</h2>
              <p className="card-subtitle">{doneCount} of {items.length} completed</p>
            </div>
            <span className="badge badge-primary">{activeType}</span>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Progress</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: progress === 100 ? 'var(--color-success)' : 'var(--color-text)' }}>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-bar-fill ${progress === 100 ? 'success' : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item) => (
              <div key={item.id} className={`checklist-item ${item.done ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  className="checklist-checkbox"
                  checked={item.done}
                  onChange={() => toggleItem(item.id)}
                />
                <span className="checklist-text">{item.text}</span>
                <GripVertical size={16} style={{ color: 'var(--color-text-tertiary)', cursor: 'grab', flexShrink: 0 }} />
                <button className="btn-icon btn-sm checklist-delete" onClick={() => removeItem(item.id)}>
                  <X size={14} />
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <CheckCircle size={40} className="empty-state-icon" />
                <p className="empty-state-title">No checklist items</p>
                <p className="empty-state-text">Load a template, use AI Generate with a feature description, or add custom items.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

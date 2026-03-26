import { useState, DragEvent } from 'react';
import { Plus, X, GripVertical, CheckCircle, Wand2, Loader2, Edit2, Check, Download, AlertTriangle } from 'lucide-react';
import { useChecklistStore } from '../../store/checklistStore';
import { useAiStore, callAi } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import type { ChecklistType, ChecklistItem } from '../../types';
import '../pages.css';
import { safeJsonParse } from '../../utils/safeJson';
import { AiLoader } from '../../components/AiLoader/AiLoader';

const TYPES: ChecklistType[] = ['Smoke', 'Sanity', 'Regression', 'Playwright Automation', 'API Test Points'];

export function ChecklistBuilder() {
  const { items, activeType, loadTemplate, addItem, removeItem, toggleItem, editItem, reorderItems, clearItems } = useChecklistStore();
  const isAiConfigured = useAiStore((s) => s.isConfigured);
  const openSettings = useAiStore((s) => s.openSettings);
  const addToast = useToastStore((s) => s.addToast);
  
  const [newItemText, setNewItemText] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'High'|'Medium'|'Low'>('Medium');
  
  const [featureDesc, setFeatureDesc] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;
  
  const highPriorityCount = items.filter((i) => i.priority === 'High' && !i.done).length;

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const success = addItem(newItemText.trim(), newItemPriority);
    if (success) {
      setNewItemText('');
      setNewItemPriority('Medium');
    } else {
      addToast({ type: 'warning', title: 'Duplicate Item', message: 'This item already exists in the checklist.' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddItem();
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditValue(item.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (!editValue.trim()) {
      addToast({ type: 'warning', title: 'Invalid edit', message: 'Item text cannot be empty.' });
      return;
    }
    editItem(editingId, { text: editValue.trim() });
    setEditingId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditingId(null);
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to prevent the dragged image from capturing the hidden state
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    reorderItems(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setDraggedIndex(null);
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('dragging');
    }
  };

  // --- External Actions ---
  const handleExport = () => {
    if (items.length === 0) {
      addToast({ type: 'warning', title: 'Nothing to export', message: 'Your checklist is empty.' });
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      type: activeType,
      exportedAt: new Date().toISOString(),
      items
    }, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `checklist_${activeType.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addToast({ type: 'success', title: 'Checklist Exported', message: 'Downloaded as JSON.' });
  };

  const handleAiGenerate = async () => {
    if (!featureDesc.trim()) {
      addToast({ type: 'warning', title: 'Feature description required' });
      return;
    }
    if (!isAiConfigured) {
      openSettings();
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await callAi({
        systemPrompt: `You are a senior QA lead with 10+ years of experience building test checklists. Given a feature description and checklist type, generate comprehensive, actionable checklist items.

STRICT RULES:
1. Return ONLY a valid JSON array — no markdown, no code fences, no explanations.
2. Each object MUST have:
   - "text" (string): Specific, actionable item starting with a verb (Verify, Validate, Check, Ensure, Confirm, Test)
   - "priority" (string): "High", "Medium", or "Low"
   - "tags" (string array): Category tags like "UI", "API", "Security", "Performance", "Accessibility", "Edge Case", "Negative", "Data"
3. Generate 12-20 items covering:
   - Core functionality (happy path)
   - Error handling and validation
   - Edge cases and boundary conditions
   - Security considerations (auth, input sanitization)
   - Performance implications
   - Accessibility checks when UI-related
   - Cross-browser/device concerns for UI features
4. Items must be SPECIFIC. Bad: "Test the feature". Good: "Verify login fails with error 'Invalid credentials' when wrong password is entered"
5. Vary priorities realistically — not everything is Medium
6. Tag each item with 1-3 relevant categories`,
        userPrompt: `Feature: ${featureDesc}\nType: ${activeType}`,
      });

      const parsed = safeJsonParse(response, []);

      if (Array.isArray(parsed) && parsed.length > 0) {
        let added = 0;
        parsed.forEach((item: any) => {
          if (item?.text && typeof item.text === 'string') {
            const success = addItem(
              item.text.trim(), 
              ['High', 'Medium', 'Low'].includes(item.priority) ? item.priority : 'Medium',
               Array.isArray(item.tags) ? item.tags : []
            );
            if(success) added++;
          }
        });
        addToast({ type: 'success', title: `${added} AI checklist items added` });
      }
    } catch (err: any) {
      if (err.message === 'AI_NOT_CONFIGURED') {
        openSettings();
      } else {
        addToast({ type: 'error', title: 'AI generation failed', message: err.message });
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
          Generate functional checklists recursively from templates or AI. Manage priority, tag states, and export.
        </p>
      </div>

      {/* Input Card */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
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
              disabled={isAiLoading}
              placeholder="Describe the feature being tested, e.g., OAuth authentication module..."
              rows={4}
              id="checklist-feature"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Checklist Template</label>
            <select
              className="form-select"
              value={activeType}
              onChange={(e) => useChecklistStore.getState().setActiveType(e.target.value as ChecklistType)}
              disabled={isAiLoading}
              id="checklist-type"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button className="btn btn-primary" onClick={() => loadTemplate(activeType)} disabled={isAiLoading}>
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

          <div className="form-group" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <label className="form-label">Add Custom Item</label>
            <div className="inline-add" style={{ marginBottom: '8px' }}>
              <input
                className="form-input"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAiLoading}
                placeholder="Type checklist criteria here..."
                data-testid="add-checklist-item"
              />
              <select 
                className="form-select" 
                style={{ width: '120px' }} 
                value={newItemPriority} 
                onChange={(e) => setNewItemPriority(e.target.value as any)}
              >
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🔵 Low</option>
              </select>
              <button className="btn btn-secondary" onClick={handleAddItem} disabled={isAiLoading}>
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Progress</h2>
            <span className="badge badge-primary">{activeType}</span>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', fontWeight: 700, color: progress === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>
              {Math.round(progress)}%
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {doneCount} of {items.length} completed
            </div>
          </div>
          <div className="progress-bar" style={{ height: '10px', marginBottom: '20px' }}>
            <div
              className={`progress-bar-fill ${progress === 100 ? 'success' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-danger)' }}>{items.filter(i => i.priority === 'High').length}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>High</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-warning)' }}>{items.filter(i => i.priority === 'Medium').length}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Medium</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-info)' }}>{items.filter(i => i.priority === 'Low').length}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Low</div>
            </div>
          </div>
          {items.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn-sm btn-secondary" onClick={handleExport}>
                <Download size={14} /> Export JSON
              </button>
              <button className="btn btn-sm btn-ghost" onClick={clearItems} style={{ color: 'var(--color-danger)' }}>
                <X size={14} /> Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checklist Items — Full Width */}
      {isAiLoading ? (
        <div style={{ padding: '60px 0' }}>
          <AiLoader message="Generating checklist..." subMessage="Building comprehensive smoke/regression checklist items based on feature" />
        </div>
      ) : items.length > 0 ? (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Checklist Items</h2>
            <span className="badge badge-neutral">{items.length} items</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className={`checklist-item ${item.done ? 'done' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  opacity: draggedIndex === index ? 0.5 : 1,
                  borderLeft: `4px solid ${item.priority === 'High' ? 'var(--color-danger)' : item.priority === 'Low' ? 'var(--color-info)' : 'var(--color-warning)'}`,
                  cursor: editingId === item.id ? 'default' : 'grab'
                }}
                data-testid={`checklist-row-${item.id}`}
              >
                <GripVertical size={16} style={{ color: 'var(--color-text-tertiary)', marginRight: '8px', flexShrink: 0, cursor: 'grab' }} />
                <input
                  type="checkbox"
                  className="checklist-checkbox"
                  checked={item.done}
                  onChange={() => toggleItem(item.id)}
                  style={{ marginRight: '12px' }}
                />
                
                {editingId === item.id ? (
                  <div style={{ display: 'flex', flex: 1, gap: '6px', alignItems: 'center' }}>
                    <input 
                      autoFocus
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: '14px', height: '30px' }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                    />
                    <button className="btn-icon btn-sm" onClick={saveEdit} style={{ color: 'var(--color-success)' }}><Check size={14} /></button>
                    <button className="btn-icon btn-sm" onClick={() => setEditingId(null)}><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className="checklist-text" style={{ fontSize: '14px', fontWeight: 500, color: item.done ? 'var(--color-text-tertiary)' : 'var(--color-text)' }}>
                        {item.text}
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {item.tags.map(t => (
                            <span key={t} style={{ fontSize: '10px', backgroundColor: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-text-tertiary)' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="badge" style={{ 
                      fontSize: '10px', padding: '2px 8px', marginRight: '8px',
                      backgroundColor: item.priority === 'High' ? 'rgba(239,68,68,0.1)' : item.priority === 'Low' ? 'rgba(59,130,246,0.1)' : 'rgba(234,179,8,0.1)',
                      color: item.priority === 'High' ? 'var(--color-danger)' : item.priority === 'Low' ? 'var(--color-info)' : 'var(--color-warning)',
                    }}>
                      {item.priority}
                    </span>
                    <button className="btn-icon btn-sm checklist-edit" onClick={() => startEditing(item)} style={{ opacity: item.done ? 0.3 : 1 }} disabled={item.done}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon btn-sm checklist-delete" onClick={() => removeItem(item.id)}>
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <CheckCircle size={40} className="empty-state-icon" style={{ opacity: 0.2 }} />
            <p className="empty-state-title" style={{ marginTop: '16px' }}>Empty Checklist</p>
            <p className="empty-state-text" style={{ fontSize: '13px' }}>
              Choose a template and click <strong>Load Template</strong>, or use <strong>AI Generate</strong> to create checklist items.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

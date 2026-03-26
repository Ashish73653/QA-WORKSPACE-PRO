import { useState } from 'react';
import { Sparkles, Send, Layers, Wand2, Loader2 } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import { useToastStore } from '../../store/toastStore';
import { useAppStore } from '../../store/appStore';
import { useAiStore, callAi } from '../../store/aiStore';
import type { Partition, PartitionType } from '../../types';
import '../pages.css';
import { AiLoader } from '../../components/AiLoader/AiLoader';

function generatePartitions(fieldName: string, rulesText: string): Partition[] {
  const partitions: Partition[] = [];
  const rules = rulesText.toLowerCase();
  let id = 1;

  // Try to extract numeric ranges
  const rangeMatch = rules.match(/(\d+)\s*[-–to]+\s*(\d+)/);
  const min = rangeMatch ? parseInt(rangeMatch[1]) : null;
  const max = rangeMatch ? parseInt(rangeMatch[2]) : null;

  if (min !== null && max !== null) {
    partitions.push({
      id: `EP-${id++}`, type: 'Valid', label: `Within range (${min}-${max})`,
      description: `Value between ${min} and ${max} characters/units`, example: String(Math.floor((min + max) / 2)),
    });
    partitions.push({
      id: `EP-${id++}`, type: 'Invalid', label: `Below minimum (< ${min})`,
      description: `Value less than the minimum of ${min}`, example: String(min - 1),
    });
    partitions.push({
      id: `EP-${id++}`, type: 'Invalid', label: `Above maximum (> ${max})`,
      description: `Value exceeding the maximum of ${max}`, example: String(max + 1),
    });
    partitions.push({
      id: `EP-${id++}`, type: 'Edge', label: `At minimum boundary (${min})`,
      description: `Value exactly at the minimum boundary`, example: String(min),
    });
    partitions.push({
      id: `EP-${id++}`, type: 'Edge', label: `At maximum boundary (${max})`,
      description: `Value exactly at the maximum boundary`, example: String(max),
    });
  }

  if (rules.includes('alphanumeric') || rules.includes('alpha')) {
    partitions.push({
      id: `EP-${id++}`, type: 'Valid', label: 'Alphanumeric characters',
      description: 'Contains only letters and numbers', example: 'User123',
    });
    partitions.push({
      id: `EP-${id++}`, type: 'Invalid', label: 'Special characters only',
      description: 'Contains only special characters', example: '@#$%^&',
    });
  }

  if (rules.includes('letter') || rules.includes('first char')) {
    partitions.push({
      id: `EP-${id++}`, type: 'Valid', label: 'Starts with a letter',
      description: 'First character is an alphabetic letter', example: 'Abc123',
    });
    partitions.push({
      id: `EP-${id++}`, type: 'Invalid', label: 'Starts with a number',
      description: 'First character is a digit', example: '1abcde',
    });
  }

  if (rules.includes('email') || rules.includes('@')) {
    partitions.push({ id: `EP-${id++}`, type: 'Valid', label: 'Valid email format', description: 'Standard email with @ and domain', example: 'user@test.com' });
    partitions.push({ id: `EP-${id++}`, type: 'Invalid', label: 'Missing @ symbol', description: 'Email without @ sign', example: 'usertest.com' });
    partitions.push({ id: `EP-${id++}`, type: 'Invalid', label: 'Missing domain', description: 'Email without domain after @', example: 'user@' });
    partitions.push({ id: `EP-${id++}`, type: 'Edge', label: 'Multiple @ symbols', description: 'Email with more than one @', example: 'u@s@t.com' });
  }

  // Generic partitions if no specific rules matched
  if (partitions.length === 0) {
    partitions.push({ id: `EP-${id++}`, type: 'Valid', label: 'Typical valid input', description: `Standard ${fieldName} input that meets all requirements`, example: 'ValidInput' });
    partitions.push({ id: `EP-${id++}`, type: 'Invalid', label: 'Empty input', description: `Empty or blank ${fieldName} value`, example: '(empty)' });
    partitions.push({ id: `EP-${id++}`, type: 'Invalid', label: 'Null/undefined', description: `Null or undefined ${fieldName}`, example: 'null' });
    partitions.push({ id: `EP-${id++}`, type: 'Edge', label: 'Whitespace only', description: `${fieldName} with only spaces`, example: '   ' });
    partitions.push({ id: `EP-${id++}`, type: 'Edge', label: 'Maximum length', description: `${fieldName} at maximum allowed length`, example: 'A'.repeat(255) });
  }

  // Always add empty/null partitions
  partitions.push({ id: `EP-${id++}`, type: 'Invalid', label: 'Empty value', description: `No input provided for ${fieldName}`, example: '(empty)' });
  partitions.push({ id: `EP-${id++}`, type: 'Edge', label: 'Whitespace input', description: `Only whitespace provided for ${fieldName}`, example: '   ' });

  return partitions;
}

export function EquivalencePartitioner() {
  const [fieldName, setFieldName] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const addCases = useCaseStore((s) => s.addCases);
  const addToast = useToastStore((s) => s.addToast);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const isAiConfigured = useAiStore((s) => s.isConfigured);
  const openSettings = useAiStore((s) => s.openSettings);

  const handleGenerate = () => {
    if (!fieldName.trim() || !rulesText.trim()) { addToast({ type: 'warning', title: 'Fill in both fields' }); return; }
    setPartitions(generatePartitions(fieldName, rulesText));
    addToast({ type: 'success', title: 'Partitions generated' });
  };

  const handleAiGenerate = async () => {
    if (!fieldName.trim() || !rulesText.trim()) { addToast({ type: 'warning', title: 'Fill in both fields' }); return; }
    if (!isAiConfigured) { openSettings(); return; }
    setIsAiLoading(true);
    try {
      const response = await callAi({
        systemPrompt: `You are a QA test design expert. Given a field name and validation rules, generate equivalence class partitions. Return ONLY a JSON array of objects with: type ("Valid"|"Invalid"|"Edge"), label (string), description (string), example (string). Generate 10-15 comprehensive partitions covering all equivalence classes. No markdown.`,
        userPrompt: `Field: ${fieldName}\nRules: ${rulesText}`,
      });
      const cleaned = response.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let id = 1;
        const results: Partition[] = parsed.map((p: any) => ({
          id: `EP-${id++}`,
          type: (['Valid','Invalid','Edge'].includes(p.type) ? p.type : 'Valid') as PartitionType,
          label: p.label || '',
          description: p.description || '',
          example: p.example || '',
        }));
        setPartitions(results);
        addToast({ type: 'success', title: `${results.length} AI partitions generated` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'AI generation failed', message: err.message });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendToCases = () => {
    if (partitions.length === 0) return;
    const cases = partitions.map((p) => ({
      id: `TC-EP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `[EP] ${fieldName}: ${p.label}`,
      type: p.type === 'Valid' ? 'Functional' as const : 'Negative' as const,
      priority: p.type === 'Invalid' ? 'High' as const : 'Medium' as const,
      expectedResult: p.type === 'Valid'
        ? 'Input is accepted and processed correctly'
        : p.type === 'Invalid'
          ? 'Validation error message is displayed'
          : 'System handles edge case gracefully',
      status: 'Todo' as const,
      sourceModule: 'Equivalence Partitioner',
    }));
    addCases(cases);
    addToast({ type: 'success', title: `${cases.length} EP cases sent to Case Formatter` });
    setActivePage('case-formatter');
  };

  const validPartitions = partitions.filter((p) => p.type === 'Valid');
  const invalidPartitions = partitions.filter((p) => p.type === 'Invalid');
  const edgePartitions = partitions.filter((p) => p.type === 'Edge');

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Equivalence Partitioner</h1>
        <p className="page-subtitle">
          Generate valid, invalid, and edge-case partitions from field validation rules in plain English.
        </p>
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">Field Rules</h2>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Field Name</label>
            <input
              className="form-input"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g., Username, Email, Password"
              id="ep-field"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Validation Rules (plain English)</label>
          <textarea
            className="form-textarea"
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            placeholder={"6-12 chars, alphanumeric, first char must be a letter\nNo special characters allowed\nCannot be empty"}
            rows={4}
            id="ep-rules"
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleGenerate} id="generate-partitions-btn" disabled={!fieldName.trim() || !rulesText.trim()}>
            <Sparkles size={16} />
            Generate
          </button>
          <button className="btn btn-secondary" onClick={handleAiGenerate} disabled={isAiLoading || !fieldName.trim() || !rulesText.trim()}
            style={isAiConfigured ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}>
            {isAiLoading ? <><Loader2 size={16} className="spin-icon" /> Generating...</> : <><Wand2 size={16} /> AI Generate</>}
          </button>
          {partitions.length > 0 && (
            <button className="btn btn-success" onClick={handleSendToCases} id="send-ep-to-cases">
              <Send size={16} />
              Send to Cases
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isAiLoading ? (
        <div style={{ padding: '60px 0' }}>
          <AiLoader message="Generating partitions..." subMessage="Calculating valid, invalid, and edge equivalence classes" />
        </div>
      ) : partitions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {validPartitions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-success)', marginBottom: '12px' }}>
                ✓ Valid Partitions ({validPartitions.length})
              </h3>
              <div className="partition-cards">
                {validPartitions.map((p) => (
                  <div key={p.id} className="partition-card valid">
                    <div className="partition-type">Valid</div>
                    <div className="partition-label">{p.label}</div>
                    <div className="partition-desc">{p.description}</div>
                    <div className="partition-example">Example: {p.example}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {invalidPartitions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '12px' }}>
                ✗ Invalid Partitions ({invalidPartitions.length})
              </h3>
              <div className="partition-cards">
                {invalidPartitions.map((p) => (
                  <div key={p.id} className="partition-card invalid">
                    <div className="partition-type">Invalid</div>
                    <div className="partition-label">{p.label}</div>
                    <div className="partition-desc">{p.description}</div>
                    <div className="partition-example">Example: {p.example}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {edgePartitions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '12px' }}>
                ⚠ Edge Cases ({edgePartitions.length})
              </h3>
              <div className="partition-cards">
                {edgePartitions.map((p) => (
                  <div key={p.id} className="partition-card edge">
                    <div className="partition-type">Edge</div>
                    <div className="partition-label">{p.label}</div>
                    <div className="partition-desc">{p.description}</div>
                    <div className="partition-example">Example: {p.example}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Layers size={48} className="empty-state-icon" />
            <p className="empty-state-title">No partitions generated</p>
            <p className="empty-state-text">Enter field name and validation rules, then click Generate to create equivalence class partitions.</p>
          </div>
        </div>
      )}
    </div>
  );
}

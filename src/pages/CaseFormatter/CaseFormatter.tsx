import { useState } from 'react';
import { Sparkles, Trash2, FileText, Wand2, Loader2 } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import { useAiStore, callAi } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import type { TestCaseType, TestCasePriority, TestCaseStatus } from '../../types';
import '../pages.css';

const TYPES: TestCaseType[] = ['Functional', 'Negative', 'Boundary', 'Security', 'UI', 'Performance', 'Smoke', 'Regression'];
const PRIORITIES: TestCasePriority[] = ['High', 'Medium', 'Low'];
const STATUSES: TestCaseStatus[] = ['Todo', 'Pass', 'Fail', 'Skip', 'Blocked'];

export function CaseFormatter() {
  const { cases, generateCases, updateCaseStatus, removeCase, clearCases, addCases } = useCaseStore();
  const isAiConfigured = useAiStore((s) => s.isConfigured);
  const openSettings = useAiStore((s) => s.openSettings);
  const addToast = useToastStore((s) => s.addToast);
  const [rawText, setRawText] = useState('');
  const [type, setType] = useState<TestCaseType>('Functional');
  const [priority, setPriority] = useState<TestCasePriority>('Medium');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const stats = {
    total: cases.length,
    pass: cases.filter((c) => c.status === 'Pass').length,
    fail: cases.filter((c) => c.status === 'Fail').length,
    skip: cases.filter((c) => c.status === 'Skip').length,
    blocked: cases.filter((c) => c.status === 'Blocked').length,
    todo: cases.filter((c) => c.status === 'Todo').length,
  };

  const passRate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(1) : '0';

  const handleGenerate = () => {
    if (!rawText.trim()) return;
    generateCases(rawText, type, priority);
    addToast({ type: 'success', title: `${rawText.split(/[\n,]+/).filter(l => l.trim()).length} test cases generated` });
    setRawText('');
  };

  const handleAiGenerate = async () => {
    if (!rawText.trim()) return;
    if (!isAiConfigured) {
      openSettings();
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await callAi({
        systemPrompt: `You are an expert QA test engineer. Given a feature description or test notes, generate comprehensive test cases. Return ONLY a JSON array of objects with these fields: title (string), type (one of: Functional, Negative, Boundary, Security, UI, Performance, Smoke, Regression), priority (one of: High, Medium, Low), expectedResult (string). Generate 8-15 test cases covering positive, negative, edge, and boundary scenarios. Be specific and detailed. Do not include any markdown formatting or code blocks, just the raw JSON array.`,
        userPrompt: `Generate test cases for:\n${rawText}`,
      });

      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        let counter = cases.length + 1;
        const newCases = parsed.map((item: any) => ({
          id: `TC-${String(counter++).padStart(3, '0')}`,
          title: item.title || 'Untitled',
          type: (TYPES.includes(item.type) ? item.type : type) as TestCaseType,
          priority: (PRIORITIES.includes(item.priority) ? item.priority : priority) as TestCasePriority,
          expectedResult: item.expectedResult || 'Expected outcome achieved',
          status: 'Todo' as TestCaseStatus,
          sourceModule: 'AI Generated',
        }));
        addCases(newCases);
        addToast({ type: 'success', title: `${newCases.length} AI-generated test cases added`, message: 'Cases include positive, negative, boundary, and edge scenarios.' });
        setRawText('');
      } else {
        addToast({ type: 'error', title: 'AI response parsing failed', message: 'Could not parse test cases from AI response.' });
      }
    } catch (err: any) {
      if (err.message === 'AI_NOT_CONFIGURED') {
        openSettings();
      } else {
        addToast({ type: 'error', title: 'AI generation failed', message: err.message || 'Unknown error' });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Case Formatter</h1>
        <p className="page-subtitle">
          Convert rough test notes into properly structured test cases with type, priority, and expected results.
        </p>
      </div>

      <div className="grid-2">
        {/* Input Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Test Notes Input</h2>
              <p className="card-subtitle">Enter one test idea per line or separate with commas</p>
            </div>
          </div>

          <div className="form-group">
            <textarea
              className="form-textarea"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"Verify login with valid credentials\nVerify login with invalid password\nCheck empty email validation\nVerify forgot password link\nTest remember me checkbox"}
              rows={8}
              id="case-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Test Type</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as TestCaseType)}
                id="case-type"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TestCasePriority)}
                id="case-priority"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleGenerate} id="generate-cases-btn" disabled={!rawText.trim()}>
              <Sparkles size={16} />
              Generate Cases
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleAiGenerate}
              id="ai-generate-btn"
              disabled={isAiLoading || !rawText.trim()}
              title={isAiConfigured ? 'Use AI to generate comprehensive test cases' : 'Configure AI key first'}
              style={isAiConfigured ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
            >
              {isAiLoading
                ? <><Loader2 size={16} className="spin-icon" /> Generating...</>
                : <><Wand2 size={16} /> AI Generate</>
              }
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Summary</h2>
            {cases.length > 0 && (
              <button className="btn btn-sm btn-ghost" onClick={clearCases}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          {cases.length > 0 ? (
            <>
              {/* Pass Rate Circle */}
              <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                <div style={{ fontSize: '40px', fontWeight: 700, color: Number(passRate) >= 80 ? 'var(--color-success)' : Number(passRate) >= 50 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                  {passRate}%
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Pass Rate</div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Total', value: stats.total, color: 'var(--color-text)' },
                  { label: 'Pass', value: stats.pass, color: 'var(--color-success)' },
                  { label: 'Fail', value: stats.fail, color: 'var(--color-danger)' },
                  { label: 'Skip', value: stats.skip, color: 'var(--color-warning)' },
                  { label: 'Blocked', value: stats.blocked, color: 'var(--color-info)' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: '16px' }}>
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div
                    className="progress-bar-fill success"
                    style={{ width: `${stats.total > 0 ? (stats.pass / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <FileText size={40} className="empty-state-icon" />
              <p className="empty-state-title">No test cases yet</p>
              <p className="empty-state-text">Enter your test notes on the left and click Generate to create structured cases.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cases Table */}
      {cases.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">Generated Test Cases</h2>
            <span className="badge badge-primary">{cases.length} cases</span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Expected Result</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((tc) => (
                  <tr key={tc.id}>
                    <td><code style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{tc.id}</code></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tc.title}</div>
                      {tc.sourceModule && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                          via {tc.sourceModule}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-neutral">{tc.type}</span></td>
                    <td>
                      <span className={`badge ${tc.priority === 'High' ? 'badge-danger' : tc.priority === 'Medium' ? 'badge-warning' : 'badge-info'}`}>
                        {tc.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '250px' }}>{tc.expectedResult}</td>
                    <td>
                      <select
                        className="status-select"
                        value={tc.status}
                        onChange={(e) => updateCaseStatus(tc.id, e.target.value as TestCaseStatus)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="btn-icon btn-sm" onClick={() => removeCase(tc.id)} title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

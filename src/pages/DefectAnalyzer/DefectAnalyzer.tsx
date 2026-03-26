import { useState } from 'react';
import { Sparkles, Copy, Bug, CheckCircle, XCircle, Wand2, Loader2 } from 'lucide-react';
import { useAiStore, callAi } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import { useDefectStore } from '../../store/defectStore';
import type { DefectDimension } from '../../types';
import '../pages.css';

interface AnalysisResult {
  score: number;
  maxScore: number;
  dimensions: DefectDimension[];
  formattedReport: string;
  missingFields: string[];
}

function analyzeDefect(rawText: string): AnalysisResult {
  const lower = rawText.toLowerCase();
  const dimensions: DefectDimension[] = [
    {
      name: 'Title Clarity',
      passed: rawText.length > 20 && !lower.startsWith('bug') && !/^(issue|problem|error)/i.test(rawText),
      description: 'Is the summary specific enough?',
    },
    {
      name: 'Reproduction Steps',
      passed: /(\d+[\.\)]\s)|step|reproduce|how to|precondition/i.test(rawText),
      description: 'Are numbered steps present?',
    },
    {
      name: 'Expected vs Actual',
      passed: (/expected|should/i.test(rawText) && /actual|instead|but |however/i.test(rawText)),
      description: 'Are both explicitly stated?',
    },
    {
      name: 'Severity Assignment',
      passed: /critical|major|minor|trivial|blocker|severity\s*[:=]/i.test(rawText),
      description: 'Is a severity level given?',
    },
    {
      name: 'Priority Assignment',
      passed: /priority\s*[:=]|(\bp[0-4]\b)|(\bhigh\b|\bmedium\b|\blow\b|\burgent\b)/i.test(rawText),
      description: 'Is priority set?',
    },
    {
      name: 'Environment Info',
      passed: /browser|chrome|firefox|safari|edge|os|windows|mac|linux|android|ios|version\s*[:=]|environment|platform/i.test(rawText),
      description: 'Browser, OS, version mentioned?',
    },
    {
      name: 'Attachments',
      passed: /screenshot|log|video|attach|image|recording|gif|png|jpg|har file/i.test(rawText),
      description: 'Screenshots, logs referenced?',
    },
    {
      name: 'Defect Uniqueness',
      passed: rawText.length > 60 && !/same as|duplicate|see also|related to/i.test(rawText),
      description: 'Is it distinguishable from other defects?',
    },
  ];

  const score = dimensions.filter((d) => d.passed).length;
  const missingFields = dimensions.filter((d) => !d.passed).map((d) => d.name);

  const title = rawText.split('\n')[0]?.substring(0, 80)?.trim() || 'Untitled Defect';

  let formattedReport = `══════════════════════════════════════════════\n`;
  formattedReport += `              DEFECT REPORT\n`;
  formattedReport += `══════════════════════════════════════════════\n\n`;
  formattedReport += `Summary: ${title}\n\n`;
  formattedReport += `──────────────────────────────────────────────\n`;
  formattedReport += `Description:\n${rawText}\n\n`;
  formattedReport += `──────────────────────────────────────────────\n`;
  formattedReport += `Steps to Reproduce:\n`;
  formattedReport += dimensions[1].passed ? `(Extracted from description above)\n\n` : `⚠ MISSING — Please add numbered steps:\n  1. Navigate to...\n  2. Click on...\n  3. Observe...\n\n`;
  formattedReport += `Expected Result:\n`;
  formattedReport += dimensions[2].passed ? `(See description)\n\n` : `⚠ MISSING — State what should happen\n\n`;
  formattedReport += `Actual Result:\n`;
  formattedReport += dimensions[2].passed ? `(See description)\n\n` : `⚠ MISSING — State what actually happened\n\n`;
  formattedReport += `──────────────────────────────────────────────\n`;
  formattedReport += `Severity:     ${dimensions[3].passed ? '(Specified)' : '⚠ NOT SET'}\n`;
  formattedReport += `Priority:     ${dimensions[4].passed ? '(Specified)' : '⚠ NOT SET'}\n`;
  formattedReport += `Environment:  ${dimensions[5].passed ? '(Specified)' : '⚠ NOT SET'}\n`;
  formattedReport += `Attachments:  ${dimensions[6].passed ? '(Referenced)' : '⚠ NONE'}\n\n`;
  formattedReport += `──────────────────────────────────────────────\n`;
  formattedReport += `Quality Score: ${score}/${8}\n`;
  if (missingFields.length > 0) {
    formattedReport += `Missing: ${missingFields.join(', ')}\n`;
  }
  formattedReport += `══════════════════════════════════════════════\n`;

  return { score, maxScore: 8, dimensions, formattedReport, missingFields };
}

export function DefectAnalyzer() {
  const defectRawText = useDefectStore((s) => s.rawText);
  const defectReport = useDefectStore((s) => s.report);
  const defectAiReport = useDefectStore((s) => s.aiReport);
  const setDefectRawText = useDefectStore((s) => s.setRawText);
  const setDefectReport = useDefectStore((s) => s.setReport);
  const setDefectAiReport = useDefectStore((s) => s.setAiReport);

  const [rawText, setRawText] = useState(defectRawText);
  const [result, setResult] = useState<AnalysisResult | null>(defectReport as AnalysisResult | null);
  const [aiReport, setAiReport] = useState(defectAiReport);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isAiConfigured = useAiStore((s) => s.isConfigured);
  const openSettings = useAiStore((s) => s.openSettings);
  const addToast = useToastStore((s) => s.addToast);

  const handleAnalyze = () => {
    if (!rawText.trim()) return;
    const analysis = analyzeDefect(rawText);
    setResult(analysis);
    setAiReport('');
    setDefectReport(analysis, rawText);
    setDefectAiReport('');
  };

  const handleAiRewrite = async () => {
    if (!rawText.trim()) return;
    if (!isAiConfigured) { openSettings(); return; }

    setIsAiLoading(true);
    try {
      const response = await callAi({
        systemPrompt: `You are a senior QA engineer expert at writing JIRA defect reports. Given a rough defect description, rewrite it as a professional, JIRA-ready bug report with these sections exactly:

**Summary:** (one clear line)
**Description:** (2-3 sentences)
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. ...
**Expected Result:** (what should happen)
**Actual Result:** (what actually happened)
**Severity:** Critical/Major/Minor/Trivial
**Priority:** P0/P1/P2/P3
**Environment:** (browser, OS, version)
**Attachments:** (what to attach)

Be specific, professional, and fill in any gaps intelligently from context.`,
        userPrompt: rawText,
      });
      setAiReport(response);
      setDefectAiReport(response);
      if (!result) {
        const analysis = analyzeDefect(rawText);
        setResult(analysis);
        setDefectReport(analysis, rawText);
      }
      addToast({ type: 'success', title: 'AI defect report generated', message: 'Professional JIRA-ready report created from your description.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'AI rewrite failed', message: err.message });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied to clipboard' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Defect DNA Analyzer</h1>
        <p className="page-subtitle">
          Score defect report quality against 8 dimensions and auto-generate a JIRA-ready bug report.
        </p>
      </div>

      <div className="grid-2">
        {/* Input */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Raw Defect Input</h2>
          </div>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={rawText}
              onChange={(e) => {
                const next = e.target.value;
                setRawText(next);
                setDefectRawText(next);
              }}
              placeholder={"Login button not working on Chrome.\n\nSteps:\n1. Open login page\n2. Enter valid credentials\n3. Click login button\n\nExpected: User should be redirected to dashboard\nActual: Nothing happens, page stays on login\n\nSeverity: Major\nEnvironment: Chrome 120, Windows 11\nScreenshot: attached"}
              rows={10}
              id="defect-input"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleAnalyze} id="analyze-defect-btn" disabled={!rawText.trim()}>
              <Sparkles size={16} />
              Analyze Quality
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleAiRewrite}
              disabled={isAiLoading || !rawText.trim()}
              style={isAiConfigured ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
            >
              {isAiLoading
                ? <><Loader2 size={16} className="spin-icon" /> Rewriting...</>
                : <><Wand2 size={16} /> AI Rewrite</>
              }
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quality Score</h2>
          </div>

          {result ? (
            <>
              <div className="score-display">
                <div className="score-number" style={{
                  color: result.score >= 7 ? 'var(--color-success)' : result.score >= 4 ? 'var(--color-warning)' : 'var(--color-danger)'
                }}>
                  {result.score}/{result.maxScore}
                </div>
                <div className="score-label">
                  {result.score >= 7 ? '🏆 Excellent Quality' : result.score >= 5 ? '⚡ Good — Minor Gaps' : result.score >= 3 ? '⚠️ Needs Improvement' : '🚨 Poor — Major Gaps'}
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
                  Dimension Breakdown
                </h3>
                <div className="dimension-list">
                  {result.dimensions.map((dim, i) => (
                    <div key={i} className="dimension-item">
                      <div className={`dimension-status ${dim.passed ? 'pass' : 'fail'}`}>
                        {dim.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      </div>
                      <span className="dimension-name">{dim.name}</span>
                      <div className="dimension-bar">
                        <div className={`dimension-bar-fill ${dim.passed ? 'pass' : 'fail'}`} style={{ width: dim.passed ? '100%' : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.missingFields.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-danger-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '4px' }}>
                    ⚠ Missing: {result.missingFields.join(', ')}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <Bug size={40} className="empty-state-icon" />
              <p className="empty-state-title">No analysis yet</p>
              <p className="empty-state-text">Enter a raw defect description and click Analyze to score its quality.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Rewritten Report */}
      {aiReport && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">AI-Generated JIRA Report</h2>
              <p className="card-subtitle">Professional defect report ready to paste into JIRA</p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => handleCopy(aiReport)}>
              <Copy size={14} /> Copy to Clipboard
            </button>
          </div>
          <div className="defect-report" style={{ whiteSpace: 'pre-wrap' }}>{aiReport}</div>
        </div>
      )}

      {/* Fallback Formatted Report */}
      {result && !aiReport && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Generated Report</h2>
              <p className="card-subtitle">Template-based report — use AI Rewrite for a polished version</p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => handleCopy(result.formattedReport)}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <div className="defect-report">{result.formattedReport}</div>
        </div>
      )}
    </div>
  );
}

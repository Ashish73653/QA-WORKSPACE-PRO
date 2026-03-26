import { useState } from 'react';
import { Sparkles, Copy, Bug, CheckCircle, XCircle, Wand2, Loader2 } from 'lucide-react';
import { useAiStore, callAi } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import { useDefectStore } from '../../store/defectStore';
import type { DefectDimension } from '../../types';
import { diffWords } from 'diff';
import '../pages.css';

interface AnalysisResult {
  score: number;
  maxScore: number;
  confidence: 'High' | 'Medium' | 'Low';
  validationLevel: 'Valid' | 'Weak' | 'Invalid';
  dimensions: DefectDimension[];
  formattedReport: string;
  missingFields: string[];
  criticalMissingFields: string[];
}

function analyzeDefect(rawText: string): AnalysisResult {
  const lower = rawText.toLowerCase();

  // 1. Validation Heuristics
  const hasProblem = /not working|fails?|error|incorrect|unexpected|broken|issue|does nothing|no response|stuck|hangs|not clickable/i.test(rawText);
  const hasBehaviorMismatch = (/expected/i.test(rawText) && /actual/i.test(rawText)) || /unintended.*?behavior|instead of|but it|happens instead/i.test(rawText);
  const hasStructure = /step|reproduce/i.test(rawText);

  let validationLevel: 'Valid' | 'Weak' | 'Invalid' = 'Valid';
  if (!hasProblem && !hasBehaviorMismatch) {
    validationLevel = 'Invalid';
  } else if ((hasProblem || hasBehaviorMismatch) && !hasStructure) {
    validationLevel = 'Weak';
  }

  // 2. Pre-extract Fields for Template & Readability Check
  let rawTitle = rawText.split('\n')[0].trim();
  if (/^title\s*:/i.test(rawTitle)) {
    rawTitle = rawTitle.replace(/^title\s*:\s*/i, '');
  }
  const title = rawTitle || 'Untitled Defect';

  const headers = "steps to reproduce|steps|expected result|expected|actual result|actual|environment|severity|priority";
  const getSection = (namePattern: string) => {
    const r = new RegExp(`(?:${namePattern})\\s*:?\\s*([\\s\\S]*?)(?=(?:\\n\\s*(?:${headers})\\s*:|$))`, 'i');
    const m = rawText.match(r);
    return m && m[1].trim() ? m[1].trim() : null;
  };

  const extSteps = getSection('steps to reproduce|steps');
  const extExpected = getSection('expected result|expected');
  const extActual = getSection('actual result|actual');
  const extEnv = getSection('environment|env');
  const extSev = getSection('severity|sev');
  const extPri = getSection('priority|pri');

  let descriptionText = title;
  if (extSteps && extExpected && extActual) {
    const featureMatch = title.split(' ')[0] || 'System';
    const cleanExpect = extExpected.split('\n')[0].split('.')[0].trim().toLowerCase().replace(/^(should|must|will|expected to)\s+/i, '');
    const cleanActual = extActual.split('\n')[0].split('.')[0].trim().toLowerCase().replace(/^(actually|currently|it)\s+/i, '');
    descriptionText = `A ${featureMatch} issue where ${cleanActual}. Instead of ${cleanExpect}, the system ${cleanActual}.`;
  }

  const parsedStructureRawText = [title, descriptionText, extSteps, extExpected, extActual, extEnv, extSev, extPri].filter(Boolean).join('\n\n');
  const isWellStructured = !!(extSteps || extExpected || extActual || parsedStructureRawText.split('\n').length > 3);
  const hasGrammarIssues = /([a-z])([A-Z])/g.test(parsedStructureRawText) || /,,|\.\./g.test(parsedStructureRawText);
  const readabilityScore = (isWellStructured && !hasGrammarIssues) ? 10 : (isWellStructured ? 5 : 0);

  const actsClearSteps = /\d+\.\s*(click|navigate|open|enter|go to|scroll|type|select|press)/i.test(rawText);
  const actsClearActual = /(fails to|does not|cannot|crashes|throws|shows error|instead of|but it|hangs|nothing)/i.test(rawText);
  const actsClearExpected = /(should|must|will|expected to).*?(open|show|display|redirect|enable|disable|work)/i.test(rawText);
  let actionabilityScore = 0;
  if (actsClearSteps) actionabilityScore += 4;
  if (actsClearActual) actionabilityScore += 3;
  if (actsClearExpected) actionabilityScore += 3;

  const dims: DefectDimension[] = [
    { name: 'Steps to Reproduce', category: 'Core', weight: 20, passed: /(?:(\d+[\.\)]\s)|step|reproduce|how to|precondition|navigate|click)/i.test(rawText) && /\d+[\.\)]/.test(rawText), partial: /reproduce|step|click/i.test(rawText) && !/\d+[\.\)]/.test(rawText), description: 'Are explicit, numbered steps present?' },
    { name: 'Expected Result', category: 'Core', weight: 15, passed: /expected|should/i.test(rawText), partial: false, description: 'Is the expected outcome stated?' },
    { name: 'Actual Result', category: 'Core', weight: 15, passed: /actual|instead|but|however|observed/i.test(rawText), partial: false, description: 'Is the current erroneous outcome stated?' },
    { name: 'Actionability', category: 'Core', weight: 10, passed: actionabilityScore === 10, partial: actionabilityScore > 0 && actionabilityScore < 10, customEarned: actionabilityScore, description: 'Are the steps and outcomes distinctly clear?' },
    { name: 'Title Clarity', category: 'Core', weight: 10, passed: rawText.split('\n')[0].length > 20 && !lower.startsWith('bug') && !/^(issue|problem|error)/i.test(rawText), partial: rawText.split('\n')[0].length > 10, description: 'Is the summary specific enough?' },
    { name: 'Environment Info', category: 'Supporting', weight: 10, passed: /(browser|chrome|firefox|safari|edge|os|windows|mac|linux|android|ios).*?(\d+|version)/i.test(rawText), partial: /browser|chrome|firefox|safari|edge|os|windows|mac|linux|android|ios|environment|platform/i.test(rawText), description: 'Browser, OS, version mentioned?' },
    { name: 'Severity Assignment', category: 'Supporting', weight: 10, passed: /critical|major|minor|trivial|blocker|severity\s*[:=]/i.test(rawText), partial: false, description: 'Is a severity level given?' },
    { name: 'Priority Assignment', category: 'Core', weight: 5, passed: /priority\s*[:=]|(\bp[0-4]\b)|(\bhigh\b|\bmedium\b|\blow\b|\burgent\b)/i.test(rawText), partial: false, description: 'Is priority set?' },
    { name: 'Readability & Structure', category: 'Optional', weight: 10, passed: readabilityScore === 10, partial: readabilityScore === 5, customEarned: readabilityScore, description: 'Is the structured output grammatical and comprehensible?' },
    { name: 'Attachments', category: 'Optional', weight: 5, passed: /screenshot|log|video|attach|image|recording|gif|png|jpg|har file/i.test(rawText), partial: false, description: 'Screenshots, videos, or logs referenced?' },
    { name: 'Defect Uniqueness', category: 'Optional', weight: 5, passed: rawText.length > 60 && !/same as|duplicate|see also|related to/i.test(rawText), partial: false, description: 'Is it distinguishable from other defects?' },
  ];

  let rawScore = 0;
  const missingFields: string[] = [];
  const criticalMissingFields: string[] = [];

  const dimensions = dims.map(d => {
    let earned = 0;
    if (d.customEarned !== undefined) {
      earned = d.customEarned;
    } else if (d.passed) {
      earned = d.weight;
      d.partial = false;
    } else if (d.partial) {
      earned = d.weight / 2;
    }

    rawScore += earned;

    if (!d.passed && !d.partial) {
      missingFields.push(d.name);
      if (d.category === 'Core') {
        criticalMissingFields.push(d.name);
      }
    }

    return d;
  });

  const hasStepsPassed = dimensions.find(d => d.name === 'Steps to Reproduce')?.passed || dimensions.find(d => d.name === 'Steps to Reproduce')?.partial;
  const hasExpectedPassed = dimensions.find(d => d.name === 'Expected Result')?.passed;
  const hasActualPassed = dimensions.find(d => d.name === 'Actual Result')?.passed;
  const hasEnvPassed = dimensions.find(d => d.name === 'Environment Info')?.passed;
  const hasSevPassed = dimensions.find(d => d.name === 'Severity Assignment')?.passed;

  const maxPossibleScore = dims.reduce((sum, d) => sum + d.weight, 0);
  let finalScore = Math.round((rawScore / maxPossibleScore) * 100);

  if (validationLevel === 'Invalid') {
    finalScore = 0;
  } else if (validationLevel === 'Weak') {
    finalScore = Math.min(finalScore, 30);
  } else if (validationLevel === 'Valid') {
    if (!hasStepsPassed && !hasActualPassed) {
      finalScore = Math.min(finalScore, 40);
    } else if (!hasExpectedPassed || !hasActualPassed) {
      finalScore = Math.min(finalScore, 60);
    }
    
    // Penalize if both critical supporting details are missing
    if (!hasEnvPassed && !hasSevPassed) {
      finalScore = Math.max(0, finalScore - 10);
    }
  }

  const hasPriorityPassed = dimensions.find(d => d.name === 'Priority Assignment')?.passed;
  const envDim = dimensions.find(d => d.name === 'Environment Info');

  if (!hasPriorityPassed) finalScore -= 5;
  if (envDim?.partial && !envDim?.passed) finalScore -= 5;

  let allPerfect = dimensions.every(d => d.passed);
  if (finalScore > 95 && !allPerfect) finalScore = 95;
  
  finalScore = Math.max(0, finalScore);

  const confidence = finalScore >= 80 ? 'High' : finalScore >= 50 ? 'Medium' : 'Low';

  let formattedReport = '';
  if (validationLevel === 'Invalid') {
    formattedReport = `❌ Invalid Defect Input\n\nReason:\nThe provided input is a system instruction / configuration text, not a defect report.\n\nPlease provide:\n- Issue description\n- Steps to reproduce\n- Expected vs Actual behavior`;
  } else {
    formattedReport = `══════════════════════════════════════════════\n`;
    formattedReport += `              DEFECT REPORT\n`;
    formattedReport += `══════════════════════════════════════════════\n\n`;
    formattedReport += `Summary: ${title}\n\n`;
    formattedReport += `──────────────────────────────────────────────\n`;
    formattedReport += `Description:\n${descriptionText}\n\n`;
    
    if (/login|sign in|auth/i.test(rawText)) {
      formattedReport += `Preconditions:\n- User account exists\n- User is on login page\n\n`;
    }

    formattedReport += `──────────────────────────────────────────────\n`;
    
    formattedReport += `Steps to Reproduce:\n`;
    formattedReport += extSteps ? `${extSteps}\n\n` : `⚠ MISSING — Please add numbered steps:\n  1. Navigate to...\n  2. Click on...\n  3. Observe...\n\n`;
    
    formattedReport += `Expected Result:\n`;
    formattedReport += extExpected ? `${extExpected}\n\n` : `⚠ MISSING — State what should happen\n\n`;
    
    formattedReport += `Actual Result:\n`;
    formattedReport += extActual ? `${extActual}\n\n` : `⚠ MISSING — State what actually happened\n\n`;
    
    formattedReport += `──────────────────────────────────────────────\n`;
    const matchBrowser = rawText.match(/(chrome|firefox|safari|edge)/i);
    const browserLabel = matchBrowser ? matchBrowser[1].charAt(0).toUpperCase() + matchBrowser[1].slice(1) : 'Not specified';
    const matchVersion = rawText.match(/(?:version\s*[:=]?\s*(\d+(\.\d+)?)|(?:chrome|firefox|safari|edge)\s+(\d+(\.\d+)?))/i);
    const versionLabel = matchVersion ? `(version ${matchVersion[1] || matchVersion[3]})` : matchBrowser ? '(version unknown)' : '';
    const matchOS = rawText.match(/(windows|mac|linux|android|ios|ubuntu)/i);
    const osLabel = matchOS ? matchOS[1].charAt(0).toUpperCase() + matchOS[1].slice(1) : 'Not specified';

    let suggestions = '';
    if (!hasPriorityPassed) suggestions += '- Add Priority to help with triaging\n';
    if (!matchVersion && matchBrowser) suggestions += '- Specify browser version for better reproducibility\n';
    if (!matchOS) suggestions += '- Include OS details if issue is environment-specific\n';
    if (!hasStepsPassed) suggestions += '- Add numbered steps to reproduce for faster debugging\n';
    if (!hasExpectedPassed) suggestions += '- Clearly state the expected result to define the correct behavior\n';
    if (!hasActualPassed) suggestions += '- Specify the actual result to explain the failure\n';
    if (!dimensions.find(d => d.name === 'Attachments')?.passed) suggestions += '- Attach a screenshot or video recording of the issue\n';
    
    formattedReport += `Severity:     ${extSev || (dimensions.find(d => d.name === 'Severity Assignment')?.passed ? '(Specified in text)' : '⚠ NOT SET')}\n`;
    formattedReport += `Priority:     ${extPri || (dimensions.find(d => d.name === 'Priority Assignment')?.passed ? '(Specified in text)' : '⚠ NOT SET')}\n`;
    formattedReport += `Environment:\n  Browser: ${browserLabel} ${versionLabel}\n  OS: ${osLabel}\n`;
    formattedReport += `Attachments:  ${dimensions.find(d => d.name === 'Attachments')?.passed ? '(Referenced)' : '⚠ NONE'}\n\n`;
    formattedReport += `──────────────────────────────────────────────\n`;
    formattedReport += `Quality Score: ${finalScore}/100 [Confidence: ${confidence}]\n\n`;
    
    formattedReport += `Improvement Suggestions:\n${suggestions || 'None. Great defect report!'}\n`;
    formattedReport += `══════════════════════════════════════════════\n`;
  }

  return { score: finalScore, maxScore: 100, confidence, validationLevel, dimensions, formattedReport, missingFields, criticalMissingFields };
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
        systemPrompt: `You are a strict defect formatter, NOT a bug generator.

Rules:
- DO NOT invent new testing scenarios or hallucinate errors.
- DO NOT change the original defect meaning.
- ONLY extract, clean, and structure the given input.
- Preserve all original information.
- If data is missing for a field, mark it strictly as "Not Provided".
- Do not assume environment, severity, priority, or reproduction steps unless explicitly given in the input.
- Keep output perfectly aligned with the input defect only.

Output must be a structured JIRA-ready defect report using exactly these sections:
**Summary:** (one clear line)
**Description:** (2-3 sentences based PRECISELY on input)
**Steps to Reproduce:**
1. Step 1...
2. Step 2...
**Expected Result:** (what should happen)
**Actual Result:** (what actually happened)
**Severity:** (Critical/Major/Minor/Trivial or Not Provided)
**Priority:** (P0/P1/P2/P3 or Not Provided)
**Environment:** (browser, OS, version or Not Provided)
**Attachments:** (what to attach or Not Provided)`,
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
              disabled={isAiLoading || !rawText.trim() || result?.validationLevel === 'Invalid'}
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
            result.validationLevel === 'Invalid' ? (
               <div className="empty-state" style={{ padding: '32px 16px', background: 'var(--color-danger-subtle)' }}>
                 <Bug size={40} className="empty-state-icon" style={{ color: 'var(--color-danger)' }} />
                 <p className="empty-state-title" style={{ color: 'var(--color-danger)' }}>Invalid Defect Input</p>
                 <p className="empty-state-text" style={{ color: 'var(--color-danger)' }}>The provided input is a system instruction or unstructured text, not a defect report.</p>
               </div>
            ) : (
            <>
              <div className="score-display">
                <div className="score-number" style={{
                  color: result.score >= 80 ? 'var(--color-success)' : result.score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'
                }}>
                  {result.score}%
                </div>
                <div className="score-label" style={{ fontWeight: 600 }}>
                  {result.score >= 80 ? '🏆 Excellent Quality' : result.score >= 50 ? '⚡ Good — Minor Gaps' : '🚨 Poor — Major Gaps'}<br/>
                  <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8 }}>({result.confidence} Confidence)</span>
                </div>
              </div>

              {result.validationLevel === 'Weak' && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-warning-subtle)', borderRadius: '8px', border: '1px solid var(--color-warning)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-warning-text, #b25e02)', marginBottom: '4px' }}>
                    ⚠ Weak Defect Detected
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-warning-text, #d97706)' }}>
                    This defect describes a behavior but lacks structural detail (steps, expected, actual). Score capped at 30%.
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
                  Dimension Breakdown
                </h3>
                <div className="dimension-list">
                  {result.dimensions.map((dim, i) => (
                    <div key={i} className="dimension-item" style={{ alignItems: 'flex-start', padding: '6px 0' }}>
                      <div className={`dimension-status ${dim.passed ? 'pass' : 'fail'}`} style={{ marginTop: '2px' }}>
                        {dim.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="dimension-name">{dim.name} <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 600, marginLeft: '4px' }}>({dim.weight}%)</span></span>
                        </div>
                        <div className="dimension-bar">
                          <div className={`dimension-bar-fill ${dim.passed ? 'pass' : 'fail'}`} style={{ width: dim.passed ? '100%' : dim.partial ? '50%' : '0%', backgroundColor: dim.partial ? 'var(--color-warning)' : '' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.criticalMissingFields && result.criticalMissingFields.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-danger-subtle)', borderRadius: '8px', border: '1px solid var(--color-danger)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🚨 Critical Missing Fields
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-danger)' }}>
                    {result.criticalMissingFields.join(', ')}
                  </div>
                </div>
              )}
              {result.missingFields.filter(f => !result.criticalMissingFields?.includes(f)).length > 0 && (
                <div style={{ marginTop: '8px', padding: '12px', background: 'var(--color-warning-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-warning-text, #b25e02)', marginBottom: '4px' }}>
                    ⚠ Optional Missing Fields
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-warning-text, #d97706)' }}>
                    {result.missingFields.filter(f => !result.criticalMissingFields?.includes(f)).join(', ')}
                  </div>
                </div>
              )}
            </>
            )
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <Bug size={40} className="empty-state-icon" />
              <p className="empty-state-title">No analysis yet</p>
              <p className="empty-state-text">Enter a raw defect description and click Analyze to score its quality.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Rewritten Report - Diff View */}
      {aiReport && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">AI Diff View: Original vs Rewritten</h2>
              <p className="card-subtitle">Changes strictly tracked to your inputs without hallucination.</p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => handleCopy(aiReport)}>
              <Copy size={14} /> Copy JIRA JSON
            </button>
          </div>
          <div className="grid-2" style={{ gap: '16px', marginTop: '16px' }}>
            {/* LEFT PANE - ORIGINAL */}
            <div className="defect-report" style={{ whiteSpace: 'pre-wrap', position: 'relative', background: '#fafafa', border: '1px solid #eee' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '12px', background: 'var(--color-bg)', padding: '0 8px', fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)' }}>
                ORIGINAL INPUT
              </div>
              <div style={{ paddingTop: '8px', lineHeight: 1.6 }}>
                {diffWords(rawText, aiReport).map((p, i, arr) => {
                  if (p.added) return null;
                  const next = arr[i+1];
                  const isModified = p.removed && next && next.added;
                  return (
                    <span key={i} style={p.removed ? { backgroundColor: isModified ? 'var(--color-warning-subtle)' : 'var(--color-danger-subtle)', color: isModified ? 'var(--color-warning-text, #b25e02)' : 'var(--color-danger)', textDecoration: 'line-through' } : { opacity: 0.6 }}>
                      {p.value}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* RIGHT PANE - AI REPORT */}
            <div className="defect-report" style={{ whiteSpace: 'pre-wrap', position: 'relative', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '12px', background: 'var(--color-bg)', padding: '0 8px', fontSize: '11px', fontWeight: 700, color: 'var(--color-success)' }}>
                AI STRUCTURED OUTPUT
              </div>
              <div style={{ paddingTop: '8px', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
                {diffWords(rawText, aiReport).map((p, i, arr) => {
                  if (p.removed) return null;
                  const prev = arr[i-1];
                  const isModified = p.added && prev && prev.removed;
                  return (
                    <span key={i} style={p.added ? { backgroundColor: isModified ? 'var(--color-warning-subtle)' : 'var(--color-success-subtle)', color: isModified ? 'var(--color-warning-text, #b25e02)' : 'var(--color-success)' } : {}}>
                      {p.value}
                    </span>
                  )
                })}
              </div>
              
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', marginBottom: '8px' }}>✨ AI Improvements Applied</h4>
                <ul style={{ fontSize: '13px', color: 'var(--color-text-secondary)', paddingLeft: '16px', margin: 0 }}>
                  <li>Clarified intent and standardized defect structure</li>
                  <li>Extracted behavior into expected vs actual bounds</li>
                  <li>JIRA-ready markdown formatting enforced</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Formatted Report */}
      {result && result.validationLevel !== 'Invalid' && !aiReport && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Generated Report</h2>
              <p className="card-subtitle">Template-based formulation — use AI Rewrite for intelligent structuring</p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => handleCopy(result.formattedReport)}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <div className="defect-report" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
            {result.formattedReport}
          </div>
        </div>
      )}
    </div>
  );
}

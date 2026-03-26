import { useState } from 'react';
import { Sparkles, Activity, Copy } from 'lucide-react';
import type { CiHealth, CiSuiteResult } from '../../types';
import { useCiStore } from '../../store/ciStore';
import '../pages.css';
import { safeJsonParse } from '../../utils/safeJson';

function parsePlaywrightJson(jsonText: string): CiHealth | null {
  try {
    const report = safeJsonParse(jsonText, null as any);
    if (!report) return null;
    let total = 0, passed = 0, failed = 0, skipped = 0, duration = 0;
    const suites: CiSuiteResult[] = [];
    const fixQueue: string[] = [];

    // Handle Playwright JSON reporter format
    const processSuite = (suite: any, parentName = '') => {
      const suiteName = suite.title || parentName || 'Root';
      let sTotal = 0, sPassed = 0, sFailed = 0, sSkipped = 0, sDuration = 0;

      if (suite.specs) {
        suite.specs.forEach((spec: any) => {
          sTotal++;
          total++;
          const testDuration = spec.tests?.[0]?.results?.[0]?.duration || 0;
          sDuration += testDuration;
          duration += testDuration;

          const status = spec.tests?.[0]?.results?.[0]?.status || spec.ok === false ? 'failed' : 'passed';
          if (status === 'passed' || spec.ok === true) { passed++; sPassed++; }
          else if (status === 'failed' || spec.ok === false) {
            failed++; sFailed++;
            fixQueue.push(`${suiteName} > ${spec.title}`);
          }
          else if (status === 'skipped') { skipped++; sSkipped++; }
        });
      }

      if (suite.suites) {
        suite.suites.forEach((s: any) => processSuite(s, suiteName));
      }

      if (sTotal > 0) {
        suites.push({ name: suiteName, total: sTotal, passed: sPassed, failed: sFailed, skipped: sSkipped, duration: sDuration });
      }
    };

    if (report.suites) {
      report.suites.forEach((s: any) => processSuite(s));
    } else if (Array.isArray(report)) {
      // Simple array format
      report.forEach((item: any) => {
        total++;
        duration += item.duration || 0;
        if (item.status === 'passed') passed++;
        else if (item.status === 'failed') { failed++; fixQueue.push(item.title || item.name || 'Unknown'); }
        else skipped++;
      });
    }

    // If no data parsed, use some defaults
    if (total === 0) {
      total = report.stats?.tests || report.stats?.total || 0;
      passed = report.stats?.passes || report.stats?.passed || 0;
      failed = report.stats?.failures || report.stats?.failed || 0;
      skipped = report.stats?.pending || report.stats?.skipped || 0;
      duration = report.stats?.duration || 0;
    }

    const durationSec = duration > 1000 ? (duration / 1000).toFixed(1) : duration;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    const standupSummary = `Test run completed: ${total} tests executed in ${durationSec}s. ${passed} passed (${passRate}% pass rate), ${failed} failed, ${skipped} skipped.${failed > 0 ? ` Top failures: ${fixQueue.slice(0, 3).join(', ')}.` : ' All tests passing.'} ${failed > 0 ? 'Action required to investigate failures before next release.' : 'Build is green and ready for deployment.'}`;

    return { total, passed, failed, skipped, duration, suites, flaky: [], fixQueue, standupSummary };
  } catch {
    return null;
  }
}

export function CiDashboard() {
  const storedCurrentJson = useCiStore((s) => s.currentJson);
  const storedPreviousJson = useCiStore((s) => s.previousJson);
  const storedHealth = useCiStore((s) => s.health);
  const setStoredCurrentJson = useCiStore((s) => s.setCurrentJson);
  const setStoredPreviousJson = useCiStore((s) => s.setPreviousJson);
  const setStoredHealth = useCiStore((s) => s.setHealth);

  const [jsonInput, setJsonInput] = useState(storedCurrentJson);
  const [prevJsonInput, setPrevJsonInput] = useState(storedPreviousJson);
  const [result, setResult] = useState<CiHealth | null>(storedHealth);
  const [error, setError] = useState('');

  const handleParse = () => {
    if (!jsonInput.trim()) return;
    setError('');
    const parsed = parsePlaywrightJson(jsonInput);
    if (!parsed) {
      setError('Could not parse the JSON report. Please check the format and try again.');
      return;
    }

    // Flaky detection
    if (prevJsonInput.trim()) {
      const prevParsed = parsePlaywrightJson(prevJsonInput);
      if (prevParsed) {
        // Simple flaky detection based on fix queue differences
        const flaky = parsed.fixQueue.filter((f) => !prevParsed.fixQueue.includes(f))
          .concat(prevParsed.fixQueue.filter((f) => !parsed.fixQueue.includes(f)));
        parsed.flaky = [...new Set(flaky)];
      }
    }

    setResult(parsed);
    setStoredHealth(parsed);
  };

  const handleCopySummary = () => {
    if (result) navigator.clipboard.writeText(result.standupSummary);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">CI/CD Test Health Dashboard</h1>
        <p className="page-subtitle">
          Paste Playwright JSON report output to visualize pass/fail results, prioritize fixes, and generate standup summaries.
        </p>
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">JSON Report Input</h2>
        </div>
        <div className="grid-2" style={{ gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Current Run JSON</label>
            <textarea
              className="form-textarea"
              value={jsonInput}
              onChange={(e) => {
                const next = e.target.value;
                setJsonInput(next);
                setStoredCurrentJson(next);
              }}
              placeholder={'Paste Playwright JSON reporter output here...\n\n{\n  "suites": [...],\n  "stats": { "tests": 42, "passes": 38, "failures": 4 }\n}'}
              rows={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              id="ci-json-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Previous Run JSON (optional — for flaky detection)</label>
            <textarea
              className="form-textarea"
              value={prevJsonInput}
              onChange={(e) => {
                const next = e.target.value;
                setPrevJsonInput(next);
                setStoredPreviousJson(next);
              }}
              placeholder="Paste previous run JSON here for flaky test detection..."
              rows={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              id="ci-prev-json-input"
            />
          </div>
        </div>
        {error && (
          <div style={{ padding: '12px', background: 'var(--color-danger-subtle)', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary" onClick={handleParse} id="parse-ci-btn">
          <Sparkles size={16} />
          Analyze Report
        </button>
      </div>

      {result ? (
        <>
          {/* Stats */}
          <div className="ci-stats" style={{ marginBottom: '24px' }}>
            <div className="ci-stat-card">
              <div className="ci-stat-value">{result.total}</div>
              <div className="ci-stat-label">Total</div>
            </div>
            <div className="ci-stat-card passed">
              <div className="ci-stat-value">{result.passed}</div>
              <div className="ci-stat-label">Passed</div>
            </div>
            <div className="ci-stat-card failed">
              <div className="ci-stat-value">{result.failed}</div>
              <div className="ci-stat-label">Failed</div>
            </div>
            <div className="ci-stat-card skipped">
              <div className="ci-stat-value">{result.skipped}</div>
              <div className="ci-stat-label">Skipped</div>
            </div>
            <div className="ci-stat-card">
              <div className="ci-stat-value">{result.duration > 1000 ? `${(result.duration / 1000).toFixed(1)}s` : `${result.duration}ms`}</div>
              <div className="ci-stat-label">Duration</div>
            </div>
          </div>

          <div className="grid-2">
            {/* Pass Rate */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Pass Rate</h2>
                <span className={`badge ${result.total > 0 && result.passed / result.total > 0.9 ? 'badge-success' : 'badge-danger'}`}>
                  {result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: '12px' }}>
                <div
                  className={`progress-bar-fill ${result.total > 0 && result.passed / result.total > 0.9 ? 'success' : result.passed / result.total > 0.7 ? 'warning' : 'danger'}`}
                  style={{ width: `${result.total > 0 ? (result.passed / result.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Fix Queue */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Fix Priority Queue</h2>
                <span className="badge badge-danger">{result.fixQueue.length} failures</span>
              </div>
              {result.fixQueue.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.fixQueue.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--color-danger-subtle)', borderRadius: '6px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-danger)', minWidth: '20px' }}>#{i + 1}</span>
                      <span style={{ color: 'var(--color-text)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--color-success)' }}>🎉 No failures — all tests passing!</p>
              )}
            </div>
          </div>

          {/* Flaky Tests */}
          {result.flaky.length > 0 && (
            <div className="card" style={{ marginTop: '24px' }}>
              <div className="card-header">
                <h2 className="card-title">Flaky Tests Detected</h2>
                <span className="badge badge-warning">{result.flaky.length} flaky</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.flaky.map((item, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'var(--color-warning-subtle)', borderRadius: '6px', fontSize: '13px', color: 'var(--color-text)' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standup Summary */}
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h2 className="card-title">Standup Summary</h2>
              <button className="btn btn-sm btn-secondary" onClick={handleCopySummary}>
                <Copy size={14} /> Copy
              </button>
            </div>
            <div style={{ padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text)' }}>
              {result.standupSummary}
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Activity size={48} className="empty-state-icon" />
            <p className="empty-state-title">No report analyzed</p>
            <p className="empty-state-text">Paste Playwright JSON output and click Analyze to see your test health dashboard.</p>
          </div>
        </div>
      )}
    </div>
  );
}

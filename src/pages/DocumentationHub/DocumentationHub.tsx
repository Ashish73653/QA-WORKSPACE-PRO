import {
  FileText, CheckSquare, LayoutGrid, Calculator, Layers,
  Play, Bug, Database, Activity, BookOpen, Download, Keyboard, Zap
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { ModulePage } from '../../types';
import '../pages.css';

const MODULES: { id: ModulePage; name: string; icon: React.ReactNode; description: string }[] = [
  { id: 'case-formatter', name: 'Case Formatter', icon: <FileText size={22} />, description: 'Convert rough test notes into structured test cases with type, priority, expected results, and execution status tracking.' },
  { id: 'checklist-builder', name: 'Checklist Builder', icon: <CheckSquare size={22} />, description: 'Generate smoke, sanity, and regression checklists from built-in templates. Track progress with visual indicators.' },
  { id: 'coverage-heatmap', name: 'Coverage Heatmap', icon: <LayoutGrid size={22} />, description: 'Visualize which feature areas have test coverage using a color-coded grid. Click to add/remove cases.' },
  { id: 'boundary-calculator', name: 'Boundary Calculator', icon: <Calculator size={22} />, description: 'Generate 7 standard boundary test values for any field. Supports Integer, Float, String Length, and Date types.' },
  { id: 'equivalence-partitioner', name: 'Equivalence Partitioner', icon: <Layers size={22} />, description: 'Create valid, invalid, and edge-case partitions from plain-English validation rules.' },
  { id: 'playwright-builder', name: 'Playwright Builder', icon: <Play size={22} />, description: 'Generate BDD feature files, TypeScript step definitions, Playwright locators, and Page Object Model stubs.' },
  { id: 'defect-analyzer', name: 'Defect Analyzer', icon: <Bug size={22} />, description: 'Score defect report quality against 8 dimensions and auto-generate JIRA-ready bug reports.' },
  { id: 'sql-generator', name: 'SQL Generator', icon: <Database size={22} />, description: 'Parse CREATE TABLE statements and generate valid/invalid test data rows plus verification queries.' },
  { id: 'ci-dashboard', name: 'CI Dashboard', icon: <Activity size={22} />, description: 'Parse Playwright JSON reports to visualize pass/fail results, detect flaky tests, and generate standup summaries.' },
];

export function DocumentationHub() {
  const setActivePage = useAppStore((s) => s.setActivePage);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Zap size={24} />
          </div>
          <div>
            <h1 className="page-title">TestFlow Nexus</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>From test ideas to execution — all in one flow</p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">Quick Start Guide</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>1</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>Set Your Project Context</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>The top bar shows your project name, version, sprint, and tester. This context is shared across all modules.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>2</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>Use Any Module</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Navigate via the sidebar. Each module solves a specific QA workflow — from test case creation to CI analysis.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>3</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>Data Flows Between Modules</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Boundary Calculator and Equivalence Partitioner can send generated test cases directly to the Case Formatter.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>4</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>Export Everything</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Use the Export button in the top bar to generate a unified test plan document from all modules.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Reference */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Module Reference</h2>
      <div className="doc-grid">
        {MODULES.map((mod) => (
          <div key={mod.id} className="doc-card" onClick={() => setActivePage(mod.id)} style={{ cursor: 'pointer' }}>
            <div className="doc-card-icon">{mod.icon}</div>
            <div className="doc-card-title">{mod.name}</div>
            <div className="doc-card-desc">{mod.description}</div>
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts & Export Info */}
      <div className="grid-2" style={{ marginTop: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Export Formats</h2>
            <Download size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: 500 }}>.txt (Plain Text)</span>
              <span className="badge badge-success">Available</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: 500 }}>.docx (Word Document)</span>
              <span className="badge badge-info">Coming Soon</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontWeight: 500 }}>Copy to Clipboard</span>
              <span className="badge badge-success">Available</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">About</h2>
            <Keyboard size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Type:</strong> Client-side SPA (no backend)</p>
            <p><strong>Data:</strong> Session-only — export before closing</p>
            <p><strong>Browser:</strong> Chrome, Firefox, Edge (latest)</p>
            <p><strong>Min Width:</strong> 1024px</p>
            <p style={{ marginTop: '8px', color: 'var(--color-text-tertiary)' }}>
              Built for QA engineers who want one unified workspace instead of switching between 6+ tools every sprint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

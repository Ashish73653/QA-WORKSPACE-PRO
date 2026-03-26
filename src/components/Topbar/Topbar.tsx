import { useState } from 'react';
import { Sun, Moon, Download, Sparkles, Copy, FileDown, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAiStore } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import { assembleExport, downloadAsText, copyToClipboard } from '../../utils/exportAssembler';
import './Topbar.css';

export function Topbar() {
  const { theme, sidebarExpanded, projectContext, toggleTheme } = useAppStore();
  const { isConfigured, openSettings } = useAiStore();
  const addToast = useToastStore((s) => s.addToast);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportTxt = () => {
    try {
      const content = assembleExport();
      const filename = `TestPlan_${projectContext.projectName}_${projectContext.version}_Sprint${projectContext.sprint}.txt`;
      downloadAsText(content, filename);
      addToast({ type: 'success', title: 'Export downloaded', message: `${filename} saved to your downloads.` });
    } catch {
      addToast({ type: 'error', title: 'Export failed', message: 'Something went wrong generating the export.' });
    }
    setShowExportMenu(false);
  };

  const handleExportCopy = () => {
    try {
      const content = assembleExport();
      copyToClipboard(content);
      addToast({ type: 'success', title: 'Copied to clipboard', message: 'Full test plan copied. Paste it anywhere.' });
    } catch {
      addToast({ type: 'error', title: 'Copy failed', message: 'Could not copy to clipboard.' });
    }
    setShowExportMenu(false);
  };

  return (
    <header className={`topbar ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <div className="topbar-left">
        <span className="topbar-title">TestFlow Nexus</span>
      </div>

      <div className="topbar-center">
        <span className="topbar-context-label">Project:</span>
        <span className="topbar-context-value">{projectContext.projectName}</span>
        <span className="topbar-context-sep">|</span>
        <span className="topbar-context-label">Version:</span>
        <span className="topbar-context-value">{projectContext.version}</span>
        <span className="topbar-context-sep">|</span>
        <span className="topbar-context-label">Sprint:</span>
        <span className="topbar-context-value">{projectContext.sprint}</span>
        <span className="topbar-context-sep">|</span>
        <span className="topbar-context-label">Tester:</span>
        <span className="topbar-context-value">{projectContext.tester}</span>
      </div>

      <div className="topbar-right">
        {/* AI Settings */}
        <button
          className="topbar-btn"
          onClick={openSettings}
          title="AI Configuration"
          id="ai-settings-btn"
          style={isConfigured ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
        >
          <Sparkles size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          className="topbar-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          id="theme-toggle"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Export */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-export-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            id="export-btn"
          >
            <Download size={16} />
            Export
            <ChevronDown size={14} />
          </button>

          {showExportMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                onClick={() => setShowExportMenu(false)}
              />
              <div className="export-dropdown">
                <button className="export-dropdown-item" onClick={handleExportTxt}>
                  <FileDown size={16} />
                  <div>
                    <div style={{ fontWeight: 500 }}>Download as .txt</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Plain text file</div>
                  </div>
                </button>
                <button className="export-dropdown-item" onClick={handleExportCopy}>
                  <Copy size={16} />
                  <div>
                    <div style={{ fontWeight: 500 }}>Copy to clipboard</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Paste anywhere</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

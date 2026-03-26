import { useState } from 'react';
import { Sun, Moon, Download, Sparkles, Copy, FileDown, ChevronDown, Check, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAiStore } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import { assembleExport, downloadAsText, downloadAsDocx, copyToClipboard } from '../../utils/exportAssembler';
import './Topbar.css';

export function Topbar() {
  const { theme, sidebarExpanded, projectContext, toggleTheme, updateProjectContext } = useAppStore();
  const { isConfigured, openSettings } = useAiStore();
  const addToast = useToastStore((s) => s.addToast);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValues, setEditValues] = useState(projectContext);

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

  const handleExportDocx = async () => {
    try {
      const content = assembleExport();
      const filename = `TestPlan_${projectContext.projectName}_${projectContext.version}_Sprint${projectContext.sprint}.docx`;
      await downloadAsDocx(content, filename);
      addToast({ type: 'success', title: 'DOCX downloaded', message: `${filename} saved to your downloads.` });
    } catch {
      addToast({ type: 'error', title: 'DOCX export failed', message: 'Something went wrong generating the .docx export.' });
    }
    setShowExportMenu(false);
  };

  const startEdit = (field: string) => {
    setEditMode(field);
    setEditValues(projectContext);
  };

  const saveEdit = (field: string) => {
    updateProjectContext(editValues);
    setEditMode(null);
    addToast({ type: 'success', title: 'Updated', message: `${field} updated successfully.` });
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditValues(projectContext);
  };

  const handleInputChange = (field: keyof typeof projectContext, value: string) => {
    setEditValues({ ...editValues, [field]: value });
  };

  return (
    <header className={`topbar ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <div className="topbar-left">
        <span className="topbar-title">VeriFlow</span>
      </div>

      <div className="topbar-center">
        {/* Project Name */}
        <span className="topbar-context-label">Project:</span>
        {editMode === 'projectName' ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              autoFocus
              type="text"
              value={editValues.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              className="topbar-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit('Project Name');
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <button onClick={() => saveEdit('projectName')} className="topbar-edit-btn" title="Save">
              <Check size={14} />
            </button>
            <button onClick={cancelEdit} className="topbar-edit-btn topbar-edit-btn-cancel" title="Cancel">
              <X size={14} />
            </button>
          </div>
        ) : (
          <span className="topbar-context-value" onClick={() => startEdit('projectName')} title="Click to edit">
            {projectContext.projectName}
          </span>
        )}
        
        <span className="topbar-context-sep">|</span>

        {/* Version */}
        <span className="topbar-context-label">Version:</span>
        {editMode === 'version' ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              autoFocus
              type="text"
              value={editValues.version}
              onChange={(e) => handleInputChange('version', e.target.value)}
              className="topbar-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit('Version');
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <button onClick={() => saveEdit('version')} className="topbar-edit-btn" title="Save">
              <Check size={14} />
            </button>
            <button onClick={cancelEdit} className="topbar-edit-btn topbar-edit-btn-cancel" title="Cancel">
              <X size={14} />
            </button>
          </div>
        ) : (
          <span className="topbar-context-value" onClick={() => startEdit('version')} title="Click to edit">
            {projectContext.version}
          </span>
        )}
        
        <span className="topbar-context-sep">|</span>

        {/* Sprint */}
        <span className="topbar-context-label">Sprint:</span>
        {editMode === 'sprint' ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              autoFocus
              type="text"
              value={editValues.sprint}
              onChange={(e) => handleInputChange('sprint', e.target.value)}
              className="topbar-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit('Sprint');
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <button onClick={() => saveEdit('sprint')} className="topbar-edit-btn" title="Save">
              <Check size={14} />
            </button>
            <button onClick={cancelEdit} className="topbar-edit-btn topbar-edit-btn-cancel" title="Cancel">
              <X size={14} />
            </button>
          </div>
        ) : (
          <span className="topbar-context-value" onClick={() => startEdit('sprint')} title="Click to edit">
            {projectContext.sprint}
          </span>
        )}
        
        <span className="topbar-context-sep">|</span>

        {/* Tester */}
        <span className="topbar-context-label">Tester:</span>
        {editMode === 'tester' ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              autoFocus
              type="text"
              value={editValues.tester}
              onChange={(e) => handleInputChange('tester', e.target.value)}
              className="topbar-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit('Tester');
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <button onClick={() => saveEdit('tester')} className="topbar-edit-btn" title="Save">
              <Check size={14} />
            </button>
            <button onClick={cancelEdit} className="topbar-edit-btn topbar-edit-btn-cancel" title="Cancel">
              <X size={14} />
            </button>
          </div>
        ) : (
          <span className="topbar-context-value" onClick={() => startEdit('tester')} title="Click to edit">
            {projectContext.tester}
          </span>
        )}
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
                <button className="export-dropdown-item" onClick={handleExportDocx}>
                  <FileDown size={16} />
                  <div>
                    <div style={{ fontWeight: 500 }}>Download as .docx</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Microsoft Word document</div>
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

import {
  FileText,
  CheckSquare,
  LayoutGrid,
  Calculator,
  Layers,
  Play,
  Bug,
  Database,
  Activity,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Zap
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { ModulePage } from '../../types';
import './Sidebar.css';

const NAV_ITEMS: { id: ModulePage; label: string; icon: React.ReactNode }[] = [
  { id: 'case-formatter', label: 'Case Formatter', icon: <FileText size={20} /> },
  { id: 'checklist-builder', label: 'Checklist Builder', icon: <CheckSquare size={20} /> },
  { id: 'coverage-heatmap', label: 'Coverage Heatmap', icon: <LayoutGrid size={20} /> },
  { id: 'boundary-calculator', label: 'Boundary Calculator', icon: <Calculator size={20} /> },
  { id: 'equivalence-partitioner', label: 'Equivalence Partitioner', icon: <Layers size={20} /> },
  { id: 'playwright-builder', label: 'Playwright Builder', icon: <Play size={20} /> },
  { id: 'defect-analyzer', label: 'Defect Analyzer', icon: <Bug size={20} /> },
  { id: 'sql-generator', label: 'SQL Generator', icon: <Database size={20} /> },
  { id: 'ci-dashboard', label: 'CI Dashboard', icon: <Activity size={20} /> },
  { id: 'documentation-hub', label: 'Documentation Hub', icon: <BookOpen size={20} /> },
];

export function Sidebar() {
  const { sidebarExpanded, activePage, setActivePage, toggleSidebar } = useAppStore();

  return (
    <aside className={`sidebar ${sidebarExpanded ? '' : 'collapsed'}`}>
      <div className="sidebar-logo" onClick={toggleSidebar} title="Toggle sidebar">
        <div className="sidebar-logo-icon">
          <Zap size={20} />
        </div>
        <span className="sidebar-logo-text">TestFlow Nexus</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
            title={item.label}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-toggle">
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle sidebar">
          {sidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>
    </aside>
  );
}

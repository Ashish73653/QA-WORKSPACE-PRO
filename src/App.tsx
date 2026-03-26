import { Sidebar } from './components/Sidebar/Sidebar';
import { Topbar } from './components/Topbar/Topbar';
import { AiSettings } from './components/AiSettings/AiSettings';
import { ToastContainer } from './components/Toast/Toast';
import { useAppStore } from './store/appStore';
import { CaseFormatter } from './pages/CaseFormatter/CaseFormatter';
import { ChecklistBuilder } from './pages/ChecklistBuilder/ChecklistBuilder';
import { CoverageHeatmap } from './pages/CoverageHeatmap/CoverageHeatmap';
import { BoundaryCalculator } from './pages/BoundaryCalculator/BoundaryCalculator';
import { EquivalencePartitioner } from './pages/EquivalencePartitioner/EquivalencePartitioner';
import { PlaywrightBuilder } from './pages/PlaywrightBuilder/PlaywrightBuilder';
import { DefectAnalyzer } from './pages/DefectAnalyzer/DefectAnalyzer';
import { SqlGenerator } from './pages/SqlGenerator/SqlGenerator';
import { CiDashboard } from './pages/CiDashboard/CiDashboard';
import { DocumentationHub } from './pages/DocumentationHub/DocumentationHub';
import './App.css';

function PageRouter() {
  const activePage = useAppStore((s) => s.activePage);

  switch (activePage) {
    case 'case-formatter': return <CaseFormatter />;
    case 'checklist-builder': return <ChecklistBuilder />;
    case 'coverage-heatmap': return <CoverageHeatmap />;
    case 'boundary-calculator': return <BoundaryCalculator />;
    case 'equivalence-partitioner': return <EquivalencePartitioner />;
    case 'playwright-builder': return <PlaywrightBuilder />;
    case 'defect-analyzer': return <DefectAnalyzer />;
    case 'sql-generator': return <SqlGenerator />;
    case 'ci-dashboard': return <CiDashboard />;
    case 'documentation-hub': return <DocumentationHub />;
    default: return <CaseFormatter />;
  }
}

function App() {
  const sidebarExpanded = useAppStore((s) => s.sidebarExpanded);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-wrapper ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <Topbar />
        <main className="main-content">
          <PageRouter />
        </main>
      </div>
      <AiSettings />
      <ToastContainer />
    </div>
  );
}

export default App;

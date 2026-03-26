import { useState } from 'react';
import { Plus, Trash2, LayoutGrid, MousePointerClick } from 'lucide-react';
import { useHeatmapStore } from '../../store/heatmapStore';
import '../pages.css';

function getCoverageLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  return 3;
}

function getCoverageLabel(level: number): string {
  switch (level) {
    case 0: return 'No coverage';
    case 1: return 'Low coverage';
    case 2: return 'Medium coverage';
    case 3: return 'High coverage';
    default: return '';
  }
}

export function CoverageHeatmap() {
  const { areas, addArea, removeArea, incrementCount, decrementCount } = useHeatmapStore();
  const [newArea, setNewArea] = useState('');

  const handleAdd = () => {
    if (!newArea.trim()) return;
    addArea(newArea.trim());
    setNewArea('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleCellClick = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      decrementCount(id);
    } else {
      incrementCount(id);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Coverage Heatmap</h1>
        <p className="page-subtitle">
          Visualize test coverage by feature area. Click to increment count, Shift+Click to decrement.
        </p>
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">Add Feature Areas</h2>
        </div>
        <div className="inline-add" style={{ marginTop: 0 }}>
          <input
            className="form-input"
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter feature area name (e.g., Login, Cart, Admin, API)..."
            id="heatmap-input"
          />
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={16} /> Add Area
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Coverage Levels:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }} />
            <span style={{ color: 'var(--color-text-tertiary)' }}>0 cases</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#DCFCE7' }} />
            <span style={{ color: 'var(--color-text-tertiary)' }}>1-2 cases</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#86EFAC' }} />
            <span style={{ color: 'var(--color-text-tertiary)' }}>3-5 cases</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#22C55E' }} />
            <span style={{ color: 'var(--color-text-tertiary)' }}>6+ cases</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      {areas.length > 0 ? (
        <div className="heatmap-grid">
          {areas.map((area) => {
            const level = getCoverageLevel(area.count);
            return (
              <div
                key={area.id}
                className={`heatmap-cell level-${level}`}
                onClick={(e) => handleCellClick(area.id, e)}
                title={`${getCoverageLabel(level)} — Click to add, Shift+Click to remove`}
              >
                <div className="heatmap-cell-name">{area.name}</div>
                <div className="heatmap-cell-count">{area.count}</div>
                <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>{getCoverageLabel(level)}</div>
                <button
                  className="btn-icon btn-sm"
                  onClick={(e) => { e.stopPropagation(); removeArea(area.id); }}
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', opacity: 0, transition: 'opacity 0.2s' }}
                  title="Remove area"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <LayoutGrid size={48} className="empty-state-icon" />
            <p className="empty-state-title">No feature areas added</p>
            <p className="empty-state-text">Add feature area names above to start building your coverage heatmap.</p>
          </div>
        </div>
      )}

      {/* Summary Table */}
      {areas.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">Coverage Summary</h2>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Feature Area</th>
                  <th>Test Cases</th>
                  <th>Coverage Level</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => {
                  const level = getCoverageLevel(area.count);
                  return (
                    <tr key={area.id}>
                      <td style={{ fontWeight: 500 }}>{area.name}</td>
                      <td>{area.count}</td>
                      <td>
                        <span className={`badge ${level === 0 ? 'badge-neutral' : level === 1 ? 'badge-warning' : level === 2 ? 'badge-info' : 'badge-success'}`}>
                          {getCoverageLabel(level)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

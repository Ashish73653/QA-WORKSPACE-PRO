import { useState } from 'react';
import { Calculator, Send, Sparkles } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import { useToastStore } from '../../store/toastStore';
import { useAppStore } from '../../store/appStore';
import type { BoundaryDataType, BoundaryValue } from '../../types';
import '../pages.css';

const DATA_TYPES: BoundaryDataType[] = ['Integer', 'Float', 'String Length', 'Date'];

function generateBoundaryValues(min: number, max: number, dataType: BoundaryDataType): BoundaryValue[] {
  if (dataType === 'Integer') {
    const mid = Math.floor((min + max) / 2);
    return [
      { label: 'Below Minimum', value: String(min - 1), validity: 'Invalid' },
      { label: 'Minimum', value: String(min), validity: 'Valid' },
      { label: 'Minimum + 1', value: String(min + 1), validity: 'Valid' },
      { label: 'Midpoint', value: String(mid), validity: 'Valid' },
      { label: 'Maximum - 1', value: String(max - 1), validity: 'Valid' },
      { label: 'Maximum', value: String(max), validity: 'Valid' },
      { label: 'Above Maximum', value: String(max + 1), validity: 'Invalid' },
    ];
  }
  if (dataType === 'Float') {
    const mid = ((min + max) / 2).toFixed(2);
    return [
      { label: 'Below Minimum', value: (min - 0.01).toFixed(2), validity: 'Invalid' },
      { label: 'Minimum', value: min.toFixed(2), validity: 'Valid' },
      { label: 'Minimum + 0.01', value: (min + 0.01).toFixed(2), validity: 'Valid' },
      { label: 'Midpoint', value: mid, validity: 'Valid' },
      { label: 'Maximum - 0.01', value: (max - 0.01).toFixed(2), validity: 'Valid' },
      { label: 'Maximum', value: max.toFixed(2), validity: 'Valid' },
      { label: 'Above Maximum', value: (max + 0.01).toFixed(2), validity: 'Invalid' },
    ];
  }
  if (dataType === 'String Length') {
    const mid = Math.floor((min + max) / 2);
    return [
      { label: 'Below Min Length', value: `${min - 1} chars`, validity: 'Invalid' },
      { label: 'Min Length', value: `${min} chars`, validity: 'Valid' },
      { label: 'Min Length + 1', value: `${min + 1} chars`, validity: 'Valid' },
      { label: 'Mid Length', value: `${mid} chars`, validity: 'Valid' },
      { label: 'Max Length - 1', value: `${max - 1} chars`, validity: 'Valid' },
      { label: 'Max Length', value: `${max} chars`, validity: 'Valid' },
      { label: 'Above Max Length', value: `${max + 1} chars`, validity: 'Invalid' },
    ];
  }
  // Date
  return [
    { label: 'Before Min Date', value: 'Day before min date', validity: 'Invalid' },
    { label: 'Min Date', value: 'Min date', validity: 'Valid' },
    { label: 'Min Date + 1', value: 'Day after min date', validity: 'Valid' },
    { label: 'Midpoint', value: 'Middle date', validity: 'Valid' },
    { label: 'Max Date - 1', value: 'Day before max date', validity: 'Valid' },
    { label: 'Max Date', value: 'Max date', validity: 'Valid' },
    { label: 'After Max Date', value: 'Day after max date', validity: 'Invalid' },
  ];
}

export function BoundaryCalculator() {
  const [fieldName, setFieldName] = useState('');
  const [dataType, setDataType] = useState<BoundaryDataType>('Integer');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  const [results, setResults] = useState<BoundaryValue[]>([]);
  const addCases = useCaseStore((s) => s.addCases);
  const addToast = useToastStore((s) => s.addToast);
  const setActivePage = useAppStore((s) => s.setActivePage);

  const handleCalculate = () => {
    if (!fieldName.trim()) { addToast({ type: 'warning', title: 'Field name required' }); return; }
    if (!minVal || !maxVal) { addToast({ type: 'warning', title: 'Min and Max values required' }); return; }
    const min = parseFloat(minVal);
    const max = parseFloat(maxVal);
    if (isNaN(min) || isNaN(max)) { addToast({ type: 'error', title: 'Invalid numbers' }); return; }
    if (min >= max) { addToast({ type: 'error', title: 'Min must be less than Max' }); return; }
    setResults(generateBoundaryValues(min, max, dataType));
    addToast({ type: 'success', title: '7 boundary values calculated', message: `BVA for ${fieldName} (${dataType}: ${min} – ${max})` });
  };

  const handleSendToCases = () => {
    if (results.length === 0) return;
    const cases = results.map((bv, _i) => ({
      id: `TC-BVA-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `[BVA] ${fieldName}: ${bv.label} = ${bv.value}`,
      type: 'Boundary' as const,
      priority: bv.validity === 'Invalid' ? 'High' as const : 'Medium' as const,
      expectedResult: bv.validity === 'Valid'
        ? 'Input is accepted and processed successfully'
        : 'Validation error is displayed to the user',
      status: 'Todo' as const,
      sourceModule: 'Boundary Calculator',
    }));
    addCases(cases);
    addToast({ type: 'success', title: `${cases.length} BVA cases sent to Case Formatter`, message: 'Navigate to Case Formatter to view them.' });
    setActivePage('case-formatter');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Boundary Calculator</h1>
        <p className="page-subtitle">
          Generate 7 standard boundary test values for any field. Automatically creates valid and invalid test cases.
        </p>
      </div>

      <div className="grid-2">
        {/* Input Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Field Configuration</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Field Name</label>
            <input
              className="form-input"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g., Age, Price, Password Length"
              id="bva-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Data Type</label>
            <select
              className="form-select"
              value={dataType}
              onChange={(e) => setDataType(e.target.value as BoundaryDataType)}
              id="bva-type"
            >
              {DATA_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Minimum Value</label>
              <input
                className="form-input"
                type="number"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                placeholder="e.g., 1"
                id="bva-min"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Value</label>
              <input
                className="form-input"
                type="number"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                placeholder="e.g., 100"
                id="bva-max"
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleCalculate} id="calculate-bva-btn">
            <Sparkles size={16} />
            Calculate Boundary Values
          </button>
        </div>

        {/* Results Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Boundary Values</h2>
            {results.length > 0 && (
              <span className="badge badge-primary">7 values</span>
            )}
          </div>

          {results.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Boundary</th>
                      <th>Value</th>
                      <th>Validity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((bv, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--color-text-tertiary)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{bv.label}</td>
                        <td><code style={{ fontSize: '13px' }}>{bv.value}</code></td>
                        <td>
                          <span className={`badge ${bv.validity === 'Valid' ? 'badge-success' : 'badge-danger'}`}>
                            {bv.validity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="action-bar">
                <button className="btn btn-success" onClick={handleSendToCases} id="send-bva-to-cases">
                  <Send size={16} />
                  Send to Case Formatter
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <Calculator size={40} className="empty-state-icon" />
              <p className="empty-state-title">No boundary values yet</p>
              <p className="empty-state-text">Configure a field and click Calculate to generate the 7 standard boundary test values.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

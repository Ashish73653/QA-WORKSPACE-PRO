import { useState } from 'react';
import { Sparkles, Copy, Database } from 'lucide-react';
import { useSqlStore } from '../../store/sqlStore';
import '../pages.css';

interface SqlResult {
  validRows: string;
  invalidRows: string;
  verificationQueries: string;
}

interface Column {
  name: string;
  type: string;
  maxLength?: number;
  isNotNull: boolean;
  isUnique: boolean;
  hasDefault: boolean;
  isPrimary: boolean;
}

function parseCreateTable(sql: string): { tableName: string; columns: Column[] } | null {
  try {
    const tableMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(/i);
    if (!tableMatch) return null;
    const tableName = tableMatch[1];

    const bodyMatch = sql.match(/\(([\s\S]+)\)/);
    if (!bodyMatch) return null;

    const body = bodyMatch[1];
    const lines = body.split(',').map((l) => l.trim()).filter((l) => l.length > 0 && !l.match(/^\s*(PRIMARY|FOREIGN|UNIQUE|INDEX|KEY|CONSTRAINT)/i));

    const columns: Column[] = lines.map((line) => {
      const parts = line.match(/[`"']?(\w+)[`"']?\s+([\w()]+(?:\(\d+(?:,\s*\d+)?\))?)/i);
      if (!parts) return null;

      const name = parts[1];
      const type = parts[2].toUpperCase();
      const upper = line.toUpperCase();
      const lengthMatch = type.match(/\((\d+)/);
      const maxLength = lengthMatch ? parseInt(lengthMatch[1]) : undefined;

      return {
        name,
        type,
        maxLength,
        isNotNull: upper.includes('NOT NULL'),
        isUnique: upper.includes('UNIQUE'),
        hasDefault: upper.includes('DEFAULT'),
        isPrimary: upper.includes('PRIMARY KEY'),
      };
    }).filter(Boolean) as Column[];

    return { tableName, columns };
  } catch {
    return null;
  }
}

function generateSqlData(tableName: string, columns: Column[]): SqlResult {
  let validRows = `-- Valid INSERT statements for ${tableName}\n`;
  validRows += `-- Covers typical, min boundary, and max boundary equivalence classes\n\n`;

  const colNames = columns.map((c) => c.name).join(', ');

  // Typical valid row
  const typicalValues = columns.map((col) => {
    const t = col.type;
    if (t.includes('INT')) return '1';
    if (t.includes('VARCHAR') || t.includes('CHAR') || t.includes('TEXT')) return `'test_value'`;
    if (t.includes('DATE')) return `'2026-03-26'`;
    if (t.includes('DECIMAL') || t.includes('FLOAT') || t.includes('DOUBLE')) return '99.99';
    if (t.includes('BOOL')) return 'TRUE';
    return `'test'`;
  });
  validRows += `INSERT INTO ${tableName} (${colNames})\nVALUES (${typicalValues.join(', ')});\n\n`;

  // Min boundary
  const minValues = columns.map((col) => {
    const t = col.type;
    if (t.includes('INT')) return '0';
    if (t.includes('VARCHAR') || t.includes('CHAR')) return `'a'`;
    if (t.includes('DATE')) return `'2000-01-01'`;
    if (t.includes('DECIMAL') || t.includes('FLOAT')) return '0.01';
    return `'a'`;
  });
  validRows += `-- Min boundary values\nINSERT INTO ${tableName} (${colNames})\nVALUES (${minValues.join(', ')});\n\n`;

  // Max boundary
  const maxValues = columns.map((col) => {
    const t = col.type;
    if (t.includes('INT')) return '2147483647';
    if (t.includes('VARCHAR') && col.maxLength) return `'${'X'.repeat(col.maxLength)}'`;
    if (t.includes('DATE')) return `'2099-12-31'`;
    if (t.includes('DECIMAL') || t.includes('FLOAT')) return '999999.99';
    return `'${'X'.repeat(50)}'`;
  });
  validRows += `-- Max boundary values\nINSERT INTO ${tableName} (${colNames})\nVALUES (${maxValues.join(', ')});\n`;

  // Invalid rows
  let invalidRows = `-- Invalid INSERT statements for ${tableName}\n`;
  invalidRows += `-- Each tests a specific constraint violation\n\n`;

  columns.forEach((col) => {
    if (col.isNotNull && !col.isPrimary) {
      invalidRows += `-- NULL on NOT NULL column: ${col.name}\n`;
      const vals = columns.map((c) => c.name === col.name ? 'NULL' : typicalValues[columns.indexOf(c)]);
      invalidRows += `INSERT INTO ${tableName} (${colNames})\nVALUES (${vals.join(', ')});\n\n`;
    }
    if (col.type.includes('VARCHAR') && col.maxLength) {
      invalidRows += `-- Oversized value for ${col.name} (${col.maxLength + 1} chars)\n`;
      const vals = columns.map((c) => c.name === col.name ? `'${'X'.repeat(col.maxLength! + 1)}'` : typicalValues[columns.indexOf(c)]);
      invalidRows += `INSERT INTO ${tableName} (${colNames})\nVALUES (${vals.join(', ')});\n\n`;
    }
    if (col.type.includes('INT')) {
      invalidRows += `-- Wrong type for ${col.name} (string instead of int)\n`;
      const vals = columns.map((c) => c.name === col.name ? `'not_a_number'` : typicalValues[columns.indexOf(c)]);
      invalidRows += `INSERT INTO ${tableName} (${colNames})\nVALUES (${vals.join(', ')});\n\n`;
    }
  });

  // Verification queries
  let verificationQueries = `-- Verification SELECT queries for ${tableName}\n\n`;
  verificationQueries += `-- Count all records\nSELECT COUNT(*) AS total_records FROM ${tableName};\n\n`;
  verificationQueries += `-- Verify valid inserts\nSELECT * FROM ${tableName} ORDER BY ${columns[0]?.name || 'id'};\n\n`;

  columns.forEach((col) => {
    if (col.isNotNull) {
      verificationQueries += `-- Verify NOT NULL constraint on ${col.name}\nSELECT * FROM ${tableName} WHERE ${col.name} IS NULL;\n\n`;
    }
    if (col.isUnique) {
      verificationQueries += `-- Verify UNIQUE constraint on ${col.name}\nSELECT ${col.name}, COUNT(*) FROM ${tableName}\nGROUP BY ${col.name} HAVING COUNT(*) > 1;\n\n`;
    }
  });

  return { validRows, invalidRows, verificationQueries };
}

export function SqlGenerator() {
  const storedSqlInput = useSqlStore((s) => s.sqlInput);
  const storedDataPack = useSqlStore((s) => s.dataPack);
  const setStoredSqlInput = useSqlStore((s) => s.setSqlInput);
  const setStoredDataPack = useSqlStore((s) => s.setDataPack);

  const [sqlInput, setSqlInput] = useState(storedSqlInput);
  const [activeTab, setActiveTab] = useState<'valid' | 'invalid' | 'queries'>('valid');
  const [result, setResult] = useState<SqlResult | null>(storedDataPack as SqlResult | null);
  const [error, setError] = useState('');

  const handleGenerate = () => {
    if (!sqlInput.trim()) return;
    setError('');
    const parsed = parseCreateTable(sqlInput);
    if (!parsed || parsed.columns.length === 0) {
      setError('Could not parse the CREATE TABLE statement. Please check the syntax and try again.');
      return;
    }
    const generated = generateSqlData(parsed.tableName, parsed.columns);
    setResult(generated);
    setStoredDataPack(generated);
  };

  const getActiveCode = () => {
    if (!result) return '';
    switch (activeTab) {
      case 'valid': return result.validRows;
      case 'invalid': return result.invalidRows;
      case 'queries': return result.verificationQueries;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">SQL Test Data Generator</h1>
        <p className="page-subtitle">
          Paste a CREATE TABLE statement and generate valid/invalid test data rows plus verification queries.
        </p>
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">SQL Schema Input</h2>
        </div>
        <div className="form-group">
          <textarea
            className="form-textarea"
            value={sqlInput}
            onChange={(e) => {
              const next = e.target.value;
              setSqlInput(next);
              setStoredSqlInput(next);
            }}
            placeholder={`CREATE TABLE users (\n  id INT PRIMARY KEY NOT NULL,\n  username VARCHAR(50) NOT NULL UNIQUE,\n  email VARCHAR(100) NOT NULL,\n  age INT,\n  created_at DATE NOT NULL DEFAULT CURRENT_DATE,\n  balance DECIMAL(10,2)\n);`}
            rows={8}
            style={{ fontFamily: 'var(--font-mono)' }}
            id="sql-input"
          />
        </div>
        {error && (
          <div style={{ padding: '12px', background: 'var(--color-danger-subtle)', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary" onClick={handleGenerate} id="generate-sql-btn">
          <Sparkles size={16} />
          Generate Test Data
        </button>
      </div>

      {/* Output */}
      {result ? (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Generated SQL</h2>
            <button className="btn btn-sm btn-secondary" onClick={handleCopy}>
              <Copy size={14} /> Copy
            </button>
          </div>

          <div className="tabs">
            <button className={`tab ${activeTab === 'valid' ? 'active' : ''}`} onClick={() => setActiveTab('valid')}>
              Valid Data
            </button>
            <button className={`tab ${activeTab === 'invalid' ? 'active' : ''}`} onClick={() => setActiveTab('invalid')}>
              Invalid Data
            </button>
            <button className={`tab ${activeTab === 'queries' ? 'active' : ''}`} onClick={() => setActiveTab('queries')}>
              Verification Queries
            </button>
          </div>

          <div className="code-block-header">
            <span className="code-block-lang">SQL</span>
            <button className="copy-btn" onClick={handleCopy}><Copy size={12} /> Copy</button>
          </div>
          <div className="code-block">{getActiveCode()}</div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Database size={48} className="empty-state-icon" />
            <p className="empty-state-title">No SQL generated</p>
            <p className="empty-state-text">Paste a CREATE TABLE statement and click Generate to create test data.</p>
          </div>
        </div>
      )}
    </div>
  );
}

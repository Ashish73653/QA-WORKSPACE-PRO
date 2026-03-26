import { useAppStore } from '../store/appStore';
import { useCaseStore } from '../store/caseStore';
import { useChecklistStore } from '../store/checklistStore';
import { useHeatmapStore } from '../store/heatmapStore';
import { useDefectStore } from '../store/defectStore';
import { usePlaywrightStore } from '../store/playwrightStore';
import { useSqlStore } from '../store/sqlStore';
import { useCiStore } from '../store/ciStore';

function pad(str: string, len: number) {
  return str.padEnd(len);
}

function divider(char = '═', len = 72) {
  return char.repeat(len);
}

function sectionHeader(title: string) {
  return `\n${divider()}\n  ${title.toUpperCase()}\n${divider()}\n`;
}

function appendIndentedLines(text: string): string {
  return text
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

export function assembleExport(): string {
  const ctx = useAppStore.getState().projectContext;
  const cases = useCaseStore.getState().cases;
  const checklistItems = useChecklistStore.getState().items;
  const checklistType = useChecklistStore.getState().activeType;
  const areas = useHeatmapStore.getState().areas;
  const defectReport = useDefectStore.getState().report;
  const defectAiReport = useDefectStore.getState().aiReport;
  const defectRawText = useDefectStore.getState().rawText;
  const playwrightGenerated = usePlaywrightStore.getState().generated;
  const sqlDataPack = useSqlStore.getState().dataPack;
  const ciHealth = useCiStore.getState().health;
  const boundaryCases = cases.filter((c) => c.sourceModule === 'BoundaryCalculator');
  const equivalenceCases = cases.filter((c) => c.sourceModule === 'EquivalencePartitioner');

  const now = new Date();
  const date = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let doc = '';

  // ── COVER ──
  doc += divider('━') + '\n';
  doc += '\n';
  doc += '    T E S T F L O W   N E X U S\n';
  doc += '    Unified Test Plan Document\n';
  doc += '\n';
  doc += divider('━') + '\n';
  doc += '\n';
  doc += `  Project:     ${ctx.projectName}\n`;
  doc += `  Version:     ${ctx.version}\n`;
  doc += `  Sprint:      ${ctx.sprint}\n`;
  doc += `  Tester:      ${ctx.tester}\n`;
  doc += `  Generated:   ${date} at ${time}\n`;
  doc += `  Tool:        VeriFlow v1.0\n`;
  doc += '\n';

  // ── TABLE OF CONTENTS ──
  doc += sectionHeader('Table of Contents');
  doc += '\n';
  const sections = [
    'Project Context',
    'Test Cases',
    'Checklist',
    'Coverage Summary',
    'Boundary Analysis',
    'Equivalence Partitions',
    'Defect Analysis',
    'Playwright Artifacts',
    'SQL Test Data',
    'CI Health Summary',
    'Test Summary Statistics',
  ];
  sections.forEach((s, i) => {
    doc += `  ${i + 1}. ${s}\n`;
  });
  doc += '\n';

  // ── 1. PROJECT CONTEXT ──
  doc += sectionHeader('1. Project Context');
  doc += '\n';
  doc += `  Project Name:     ${ctx.projectName}\n`;
  doc += `  Version:          ${ctx.version}\n`;
  doc += `  Sprint Number:    ${ctx.sprint}\n`;
  doc += `  Tester:           ${ctx.tester}\n`;
  doc += `  Report Date:      ${date}\n`;
  doc += '\n';

  // ── 2. TEST CASES ──
  doc += sectionHeader('2. Test Cases');
  doc += '\n';

  if (cases.length === 0) {
    doc += '  No test cases have been generated yet.\n';
  } else {
    // Stats
    const pass = cases.filter(c => c.status === 'Pass').length;
    const fail = cases.filter(c => c.status === 'Fail').length;
    const skip = cases.filter(c => c.status === 'Skip').length;
    const blocked = cases.filter(c => c.status === 'Blocked').length;
    const todo = cases.filter(c => c.status === 'Todo').length;

    doc += `  Total Cases: ${cases.length}\n`;
    doc += `  Pass: ${pass}  |  Fail: ${fail}  |  Skip: ${skip}  |  Blocked: ${blocked}  |  Todo: ${todo}\n`;
    doc += '\n';

    // Table
    doc += `  ${pad('ID', 12)}${pad('Title', 40)}${pad('Type', 16)}${pad('Priority', 10)}${pad('Status', 10)}\n`;
    doc += `  ${'-'.repeat(12)}${'-'.repeat(40)}${'-'.repeat(16)}${'-'.repeat(10)}${'-'.repeat(10)}\n`;

    cases.forEach((tc) => {
      doc += `  ${pad(tc.id, 12)}${pad(tc.title.substring(0, 38), 40)}${pad(tc.type, 16)}${pad(tc.priority, 10)}${pad(tc.status, 10)}\n`;
    });

    doc += '\n';

    // Detailed cases
    doc += '  --- Detailed Test Cases ---\n\n';
    cases.forEach((tc) => {
      doc += `  [${tc.id}] ${tc.title}\n`;
      doc += `    Type:            ${tc.type}\n`;
      doc += `    Priority:        ${tc.priority}\n`;
      doc += `    Expected Result: ${tc.expectedResult}\n`;
      doc += `    Status:          ${tc.status}\n`;
      if (tc.sourceModule) doc += `    Source:          ${tc.sourceModule}\n`;
      doc += '\n';
    });
  }

  // ── 3. CHECKLIST ──
  doc += sectionHeader('3. Checklist');
  doc += '\n';

  if (checklistItems.length === 0) {
    doc += '  No checklist items have been created yet.\n';
  } else {
    const done = checklistItems.filter(i => i.done).length;
    doc += `  Type: ${checklistType}\n`;
    doc += `  Progress: ${done}/${checklistItems.length} (${Math.round((done / checklistItems.length) * 100)}%)\n\n`;

    checklistItems.forEach((item) => {
      doc += `  [${item.done ? 'x' : ' '}] ${item.text}\n`;
    });
  }
  doc += '\n';

  // ── 4. COVERAGE SUMMARY ──
  doc += sectionHeader('4. Coverage Summary');
  doc += '\n';

  if (areas.length === 0) {
    doc += '  No feature areas have been defined yet.\n';
  } else {
    doc += `  ${pad('Feature Area', 30)}${pad('Test Cases', 15)}${pad('Coverage Level', 20)}\n`;
    doc += `  ${'-'.repeat(30)}${'-'.repeat(15)}${'-'.repeat(20)}\n`;

    areas.forEach((area) => {
      const level = area.count === 0 ? 'No Coverage' : area.count <= 2 ? 'Low' : area.count <= 5 ? 'Medium' : 'High';
      doc += `  ${pad(area.name, 30)}${pad(String(area.count), 15)}${pad(level, 20)}\n`;
    });

    const totalCases = areas.reduce((sum, a) => sum + a.count, 0);
    doc += `\n  Total areas: ${areas.length}  |  Total cases across areas: ${totalCases}\n`;
  }
  doc += '\n';

  // ── 5. BOUNDARY ANALYSIS ──
  doc += sectionHeader('5. Boundary Analysis');
  doc += '\n';

  if (boundaryCases.length === 0) {
    doc += '  No boundary-generated test cases available yet.\n';
  } else {
    doc += `  Boundary cases generated: ${boundaryCases.length}\n\n`;
    boundaryCases.forEach((tc) => {
      doc += `  [${tc.id}] ${tc.title}\n`;
      doc += `    Type: ${tc.type}  |  Priority: ${tc.priority}  |  Status: ${tc.status}\n`;
      doc += `    Expected: ${tc.expectedResult}\n\n`;
    });
  }

  // ── 6. EQUIVALENCE PARTITIONS ──
  doc += sectionHeader('6. Equivalence Partitions');
  doc += '\n';

  if (equivalenceCases.length === 0) {
    doc += '  No equivalence-generated test cases available yet.\n';
  } else {
    doc += `  Equivalence cases generated: ${equivalenceCases.length}\n\n`;
    equivalenceCases.forEach((tc) => {
      doc += `  [${tc.id}] ${tc.title}\n`;
      doc += `    Type: ${tc.type}  |  Priority: ${tc.priority}  |  Status: ${tc.status}\n`;
      doc += `    Expected: ${tc.expectedResult}\n\n`;
    });
  }

  // ── 7. DEFECT ANALYSIS ──
  doc += sectionHeader('7. Defect Analysis');
  doc += '\n';

  if (!defectReport && !defectAiReport && !defectRawText.trim()) {
    doc += '  No defect analysis generated yet.\n';
  } else {
    if (defectReport) {
      doc += `  Quality Score: ${defectReport.score}/${defectReport.maxScore}\n`;
      doc += `  Missing Dimensions: ${defectReport.missingFields.length === 0 ? 'None' : defectReport.missingFields.join(', ')}\n\n`;
    }

    if (defectAiReport) {
      doc += '  AI-Rewritten JIRA Report:\n\n';
      doc += `${appendIndentedLines(defectAiReport)}\n\n`;
    } else if (defectReport?.formattedReport) {
      doc += '  Generated Defect Report:\n\n';
      doc += `${appendIndentedLines(defectReport.formattedReport)}\n\n`;
    } else if (defectRawText.trim()) {
      doc += '  Raw Defect Input:\n\n';
      doc += `${appendIndentedLines(defectRawText)}\n\n`;
    }
  }

  // ── 8. PLAYWRIGHT ARTIFACTS ──
  doc += sectionHeader('8. Playwright Artifacts');
  doc += '\n';

  if (!playwrightGenerated) {
    doc += '  No Playwright artifacts generated yet.\n';
  } else {
    doc += '  Feature File:\n\n';
    doc += `${appendIndentedLines(playwrightGenerated.featureText || '(empty)')}\n\n`;
    doc += '  Step Definitions:\n\n';
    doc += `${appendIndentedLines(playwrightGenerated.stepDefText || '(empty)')}\n\n`;
    doc += '  Locator Suggestions:\n\n';
    doc += `${appendIndentedLines(playwrightGenerated.locatorSuggestions || '(empty)')}\n\n`;
    doc += '  Page Object Model:\n\n';
    doc += `${appendIndentedLines(playwrightGenerated.pomClass || '(empty)')}\n\n`;
  }

  // ── 9. SQL TEST DATA ──
  doc += sectionHeader('9. SQL Test Data');
  doc += '\n';

  if (!sqlDataPack) {
    doc += '  No SQL test data generated yet.\n';
  } else {
    doc += '  Valid Rows:\n\n';
    doc += `${appendIndentedLines(sqlDataPack.validRows || '(empty)')}\n\n`;
    doc += '  Invalid Rows:\n\n';
    doc += `${appendIndentedLines(sqlDataPack.invalidRows || '(empty)')}\n\n`;
    doc += '  Verification Queries:\n\n';
    doc += `${appendIndentedLines(sqlDataPack.verificationQueries || '(empty)')}\n\n`;
  }

  // ── 10. CI HEALTH SUMMARY ──
  doc += sectionHeader('10. CI Health Summary');
  doc += '\n';

  if (!ciHealth) {
    doc += '  No CI report analyzed yet.\n';
  } else {
    const passRate = ciHealth.total > 0 ? ((ciHealth.passed / ciHealth.total) * 100).toFixed(1) : '0';
    doc += `  Total: ${ciHealth.total}  |  Passed: ${ciHealth.passed}  |  Failed: ${ciHealth.failed}  |  Skipped: ${ciHealth.skipped}\n`;
    doc += `  Pass Rate: ${passRate}%\n`;
    doc += `  Duration: ${ciHealth.duration > 1000 ? `${(ciHealth.duration / 1000).toFixed(1)}s` : `${ciHealth.duration}ms`}\n\n`;

    if (ciHealth.fixQueue.length > 0) {
      doc += '  Fix Queue:\n';
      ciHealth.fixQueue.forEach((item, idx) => {
        doc += `  ${idx + 1}. ${item}\n`;
      });
      doc += '\n';
    }

    if (ciHealth.flaky.length > 0) {
      doc += '  Flaky Tests:\n';
      ciHealth.flaky.forEach((item, idx) => {
        doc += `  ${idx + 1}. ${item}\n`;
      });
      doc += '\n';
    }

    doc += '  Standup Summary:\n\n';
    doc += `${appendIndentedLines(ciHealth.standupSummary)}\n\n`;
  }

  // ── 11. SUMMARY STATISTICS ──
  doc += sectionHeader('11. Test Summary Statistics');
  doc += '\n';

  const totalCases = cases.length;
  const passRate = totalCases > 0
    ? ((cases.filter(c => c.status === 'Pass').length / totalCases) * 100).toFixed(1)
    : '0';

  doc += `  Total Test Cases:     ${totalCases}\n`;
  doc += `  Pass Rate:            ${passRate}%\n`;
  doc += `  Checklist Items:      ${checklistItems.length}\n`;
  doc += `  Checklist Complete:   ${checklistItems.filter(i => i.done).length}\n`;
  doc += `  Coverage Areas:       ${areas.length}\n`;
  doc += `  Boundary Cases:       ${boundaryCases.length}\n`;
  doc += `  Equivalence Cases:    ${equivalenceCases.length}\n`;
  doc += `  Defect Analysis:      ${defectReport ? 'Available' : defectAiReport ? 'AI Report Only' : 'Not Generated'}\n`;
  doc += `  Playwright Bundle:    ${playwrightGenerated ? 'Available' : 'Not Generated'}\n`;
  doc += `  SQL Data Pack:        ${sqlDataPack ? 'Available' : 'Not Generated'}\n`;
  doc += `  CI Health:            ${ciHealth ? 'Available' : 'Not Generated'}\n`;
  doc += '\n';

  // ── FOOTER ──
  doc += divider('━') + '\n';
  doc += '  Generated by VeriFlow v1.0\n';
  doc += '  From test ideas to execution — all in one flow\n';
  doc += divider('━') + '\n';

  return doc;
}

export function downloadAsText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadAsDocx(content: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');

  const paragraphs = content.split('\n').map((line) => new Paragraph({
    children: [new TextRun({
      text: line.length > 0 ? line : ' ',
      font: 'Consolas',
      size: 20,
    })],
  }));

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

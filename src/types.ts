export type ModulePage =
  | 'case-formatter'
  | 'checklist-builder'
  | 'coverage-heatmap'
  | 'boundary-calculator'
  | 'equivalence-partitioner'
  | 'playwright-builder'
  | 'defect-analyzer'
  | 'sql-generator'
  | 'ci-dashboard'
  | 'documentation-hub';

export interface ProjectContext {
  projectName: string;
  version: string;
  sprint: string;
  tester: string;
}

export type TestCaseType = 'Functional' | 'Negative' | 'Boundary' | 'Security' | 'UI' | 'Performance' | 'Smoke' | 'Regression';
export type TestCasePriority = 'High' | 'Medium' | 'Low';
export type TestCaseStatus = 'Todo' | 'Pass' | 'Fail' | 'Skip' | 'Blocked';

export interface TestCase {
  id: string;
  title: string;
  type: TestCaseType;
  priority: TestCasePriority;
  expectedResult: string;
  status: TestCaseStatus;
  sourceModule?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  priority: 'High' | 'Medium' | 'Low';
  tags: string[];
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export type ChecklistType = 'Smoke' | 'Sanity' | 'Regression' | 'Playwright Automation' | 'API Test Points';

export interface CoverageArea {
  id: string;
  name: string;
  count: number;
}

export type BoundaryDataType = 'Integer' | 'Float' | 'String Length' | 'Date';

export interface BoundaryValue {
  label: string;
  value: string;
  validity: 'Valid' | 'Invalid';
}

export interface BoundarySet {
  fieldName: string;
  dataType: BoundaryDataType;
  min: number;
  max: number;
  values: BoundaryValue[];
}

export type PartitionType = 'Valid' | 'Invalid' | 'Edge';

export interface Partition {
  id: string;
  type: PartitionType;
  label: string;
  description: string;
  example: string;
}

export interface PartitionSet {
  fieldName: string;
  rulesText: string;
  partitions: Partition[];
}

export interface BddBundle {
  featureText: string;
  stepDefText: string;
  locatorSuggestions: string;
  pomClass: string;
}

export type DefectDimensionCategory = 'Core' | 'Supporting' | 'Optional';

export interface DefectDimension {
  name: string;
  category: 'Core' | 'Supporting' | 'Optional';
  weight: number;
  passed: boolean;
  partial: boolean;
  description: string;
  customEarned?: number;
}

export interface DefectReport {
  score: number;
  maxScore: number;
  confidence: 'High' | 'Medium' | 'Low';
  validationLevel: 'Valid' | 'Weak' | 'Invalid';
  dimensions: DefectDimension[];
  formattedReport: string;
  missingFields: string[];
  criticalMissingFields: string[];
}

export interface SqlDataPack {
  validRows: string;
  invalidRows: string;
  verificationQueries: string;
}

export interface CiSuiteResult {
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface CiHealth {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  suites: CiSuiteResult[];
  flaky: string[];
  fixQueue: string[];
  standupSummary: string;
}

import { create } from 'zustand';
import type { TestCase, TestCaseType, TestCasePriority, TestCaseStatus } from '../types';

interface CaseState {
  cases: TestCase[];
  addCase: (tc: TestCase) => void;
  addCases: (tcs: TestCase[]) => void;
  removeCase: (id: string) => void;
  updateCaseStatus: (id: string, status: TestCaseStatus) => void;
  clearCases: () => void;
  generateCases: (rawText: string, type: TestCaseType, priority: TestCasePriority) => void;
}

let caseCounter = 1;

function inferExpectedResult(title: string): string {
  const lower = title.toLowerCase().trim();
  if (lower.includes('invalid') || lower.includes('error') || lower.includes('fail') || lower.includes('wrong') || lower.includes('negative'))
    return 'Error message is displayed to the user';
  if (lower.includes('login') || lower.includes('sign in'))
    return 'User is redirected to the dashboard';
  if (lower.includes('logout') || lower.includes('sign out'))
    return 'User is redirected to the login page';
  if (lower.includes('delete') || lower.includes('remove'))
    return 'Item is removed and confirmation is shown';
  if (lower.includes('add') || lower.includes('create') || lower.includes('new'))
    return 'New item is created and displayed in the list';
  if (lower.includes('update') || lower.includes('edit') || lower.includes('modify'))
    return 'Changes are saved and reflected in the UI';
  if (lower.includes('search') || lower.includes('filter'))
    return 'Relevant results are displayed';
  if (lower.includes('navigate') || lower.includes('redirect'))
    return 'User is navigated to the correct page';
  if (lower.includes('download') || lower.includes('export'))
    return 'File is downloaded successfully';
  if (lower.includes('upload'))
    return 'File is uploaded and confirmation is shown';
  return 'Operation completes successfully with expected outcome';
}

export const useCaseStore = create<CaseState>((set) => ({
  cases: [],
  addCase: (tc) => set((state) => ({ cases: [...state.cases, tc] })),
  addCases: (tcs) => set((state) => ({ cases: [...state.cases, ...tcs] })),
  removeCase: (id) => set((state) => ({ cases: state.cases.filter((c) => c.id !== id) })),
  updateCaseStatus: (id, status) =>
    set((state) => ({
      cases: state.cases.map((c) => (c.id === id ? { ...c, status } : c)),
    })),
  clearCases: () => {
    caseCounter = 1;
    set({ cases: [] });
  },
  generateCases: (rawText, type, priority) =>
    set((state) => {
      const lines = rawText
        .split(/[\n,]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const newCases: TestCase[] = lines.map((line) => ({
        id: `TC-${String(caseCounter++).padStart(3, '0')}`,
        title: line,
        type,
        priority,
        expectedResult: inferExpectedResult(line),
        status: 'Todo' as TestCaseStatus,
      }));
      return { cases: [...state.cases, ...newCases] };
    }),
}));

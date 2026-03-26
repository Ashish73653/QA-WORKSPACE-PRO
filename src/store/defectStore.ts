import { create } from 'zustand';
import type { DefectReport } from '../types';

interface DefectState {
  rawText: string;
  report: DefectReport | null;
  aiReport: string;
  setRawText: (rawText: string) => void;
  setReport: (report: DefectReport, rawText: string) => void;
  setAiReport: (aiReport: string) => void;
  clear: () => void;
}

export const useDefectStore = create<DefectState>((set) => ({
  rawText: '',
  report: null,
  aiReport: '',
  setRawText: (rawText) => set({ rawText }),
  setReport: (report, rawText) => set({ report, rawText }),
  setAiReport: (aiReport) => set({ aiReport }),
  clear: () => set({ rawText: '', report: null, aiReport: '' }),
}));

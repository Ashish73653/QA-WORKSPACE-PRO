import { create } from 'zustand';
import type { SqlDataPack } from '../types';

interface SqlState {
  sqlInput: string;
  dataPack: SqlDataPack | null;
  setSqlInput: (value: string) => void;
  setDataPack: (value: SqlDataPack | null) => void;
  clear: () => void;
}

export const useSqlStore = create<SqlState>((set) => ({
  sqlInput: '',
  dataPack: null,
  setSqlInput: (value) => set({ sqlInput: value }),
  setDataPack: (value) => set({ dataPack: value }),
  clear: () => set({ sqlInput: '', dataPack: null }),
}));

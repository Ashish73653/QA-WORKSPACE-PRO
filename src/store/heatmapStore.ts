import { create } from 'zustand';
import type { CoverageArea } from '../types';

interface HeatmapState {
  areas: CoverageArea[];
  addArea: (name: string) => void;
  removeArea: (id: string) => void;
  incrementCount: (id: string) => void;
  decrementCount: (id: string) => void;
  clearAreas: () => void;
}

let areaCounter = 1;

export const useHeatmapStore = create<HeatmapState>((set) => ({
  areas: [],
  addArea: (name) =>
    set((state) => ({
      areas: [
        ...state.areas,
        { id: `AREA-${String(areaCounter++).padStart(2, '0')}`, name, count: 0 },
      ],
    })),
  removeArea: (id) => set((state) => ({ areas: state.areas.filter((a) => a.id !== id) })),
  incrementCount: (id) =>
    set((state) => ({
      areas: state.areas.map((a) => (a.id === id ? { ...a, count: a.count + 1 } : a)),
    })),
  decrementCount: (id) =>
    set((state) => ({
      areas: state.areas.map((a) =>
        a.id === id ? { ...a, count: Math.max(0, a.count - 1) } : a
      ),
    })),
  clearAreas: () => {
    areaCounter = 1;
    set({ areas: [] });
  },
}));

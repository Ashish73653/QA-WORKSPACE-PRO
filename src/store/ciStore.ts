import { create } from 'zustand';
import type { CiHealth } from '../types';

interface CiState {
  currentJson: string;
  previousJson: string;
  health: CiHealth | null;
  setCurrentJson: (value: string) => void;
  setPreviousJson: (value: string) => void;
  setHealth: (value: CiHealth | null) => void;
  clear: () => void;
}

export const useCiStore = create<CiState>((set) => ({
  currentJson: '',
  previousJson: '',
  health: null,
  setCurrentJson: (value) => set({ currentJson: value }),
  setPreviousJson: (value) => set({ previousJson: value }),
  setHealth: (value) => set({ health: value }),
  clear: () => set({ currentJson: '', previousJson: '', health: null }),
}));

import { create } from 'zustand';
import type { BddBundle } from '../types';

interface PlaywrightState {
  userStory: string;
  criteria: string;
  locatorHint: string;
  generated: BddBundle | null;
  setUserStory: (value: string) => void;
  setCriteria: (value: string) => void;
  setLocatorHint: (value: string) => void;
  setGenerated: (value: BddBundle | null) => void;
  clear: () => void;
}

export const usePlaywrightStore = create<PlaywrightState>((set) => ({
  userStory: '',
  criteria: '',
  locatorHint: '',
  generated: null,
  setUserStory: (value) => set({ userStory: value }),
  setCriteria: (value) => set({ criteria: value }),
  setLocatorHint: (value) => set({ locatorHint: value }),
  setGenerated: (value) => set({ generated: value }),
  clear: () => set({ userStory: '', criteria: '', locatorHint: '', generated: null }),
}));

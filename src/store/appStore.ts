import { create } from 'zustand';
import type { ModulePage, ProjectContext } from '../types';

interface AppState {
  theme: 'light' | 'dark';
  sidebarExpanded: boolean;
  activePage: ModulePage;
  projectContext: ProjectContext;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setActivePage: (page: ModulePage) => void;
  updateProjectContext: (ctx: Partial<ProjectContext>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  sidebarExpanded: true,
  activePage: 'case-formatter',
  projectContext: {
    projectName: 'Checkout',
    version: 'v1.0',
    sprint: '12',
    tester: 'QA Analyst',
  },
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      return { theme: newTheme };
    }),
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
  setActivePage: (page) => set({ activePage: page }),
  updateProjectContext: (ctx) =>
    set((state) => ({
      projectContext: { ...state.projectContext, ...ctx },
    })),
}));

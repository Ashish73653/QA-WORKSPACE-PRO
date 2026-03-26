import { create } from 'zustand';
import type { ChecklistItem, ChecklistType } from '../types';

const TEMPLATES: Record<ChecklistType, string[]> = {
  'Smoke': [
    'Application launches without errors',
    'Login with valid credentials succeeds',
    'Main navigation links are accessible',
    'Core feature loads data correctly',
    'Logout functionality works',
    'No console errors on main pages',
    'API endpoints return expected status codes',
    'Critical user flow completes end-to-end',
  ],
  'Sanity': [
    'Verify new feature is accessible from UI',
    'Verify basic CRUD operations work',
    'Verify data persists after page navigation',
    'Verify form validations are functioning',
    'Verify error messages display correctly',
    'Verify user permissions are enforced',
  ],
  'Regression': [
    'All previously passing test cases still pass',
    'Login/logout flow unchanged',
    'Data integrity maintained after updates',
    'Search and filter functionality works',
    'Pagination works correctly',
    'Export/download features function properly',
    'Email notifications trigger correctly',
    'Third-party integrations are stable',
    'Performance benchmarks are not degraded',
    'Accessibility standards are maintained',
  ],
  'Playwright Automation': [
    'Page objects are defined for all critical pages',
    'Locators use data-testid attributes where possible',
    'Tests run in headless mode without failure',
    'Test isolation — no shared state between tests',
    'Screenshots captured on failure',
    'API mocking is set up for external services',
    'Cross-browser tests pass (Chrome, Firefox)',
    'CI pipeline executes tests on every PR',
  ],
  'API Test Points': [
    'GET endpoints return 200 with valid data',
    'POST endpoints create resources and return 201',
    'PUT/PATCH endpoints update resources correctly',
    'DELETE endpoints remove resources and return appropriate status',
    'Invalid requests return 400 Bad Request',
    'Unauthorized access returns 401',
    'Missing resources return 404',
    'Rate limiting headers are present',
    'Response schemas match API documentation',
  ],
};

import { persist } from 'zustand/middleware';

interface ChecklistState {
  items: ChecklistItem[];
  activeType: ChecklistType;
  setActiveType: (type: ChecklistType) => void;
  loadTemplate: (type: ChecklistType) => void;
  addItem: (text: string, priority?: 'High' | 'Medium' | 'Low', tags?: string[]) => boolean;
  editItem: (id: string, updates: Partial<ChecklistItem>) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  reorderItems: (startIndex: number, endIndex: number) => void;
  clearItems: () => void;
}

const generateId = () => `CL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      items: [],
      activeType: 'Smoke',
      setActiveType: (type) => set({ activeType: type }),
      loadTemplate: (type) => {
        const templateItems = TEMPLATES[type] || [];
        const existingItems = get().items;
        const newItems: ChecklistItem[] = [];
        
        templateItems.forEach((text) => {
          if (!existingItems.some(i => i.text.toLowerCase() === text.toLowerCase())) {
            newItems.push({
              id: generateId(),
              text,
              done: false,
              priority: 'Medium',
              tags: [],
              category: type,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        });
        
        set({ items: [...existingItems, ...newItems], activeType: type });
      },
      addItem: (text, priority = 'Medium', tags = []) => {
        const state = get();
        if (state.items.some(i => i.text.toLowerCase() === text.toLowerCase())) {
          return false; // Duplicate check
        }
        
        set({
          items: [
            ...state.items,
            { 
              id: generateId(), 
              text, 
              done: false,
              priority,
              tags,
              category: state.activeType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            },
          ],
        });
        return true;
      },
      editItem: (id, updates) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i)
      })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      toggleItem: (id) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, done: !i.done, updatedAt: Date.now() } : i)),
        })),
      reorderItems: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.items);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { items: result };
      }),
      clearItems: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'veriflow-checklist-storage',
    }
  )
);

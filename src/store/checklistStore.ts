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

interface ChecklistState {
  items: ChecklistItem[];
  activeType: ChecklistType;
  setActiveType: (type: ChecklistType) => void;
  loadTemplate: (type: ChecklistType) => void;
  addItem: (text: string) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  clearItems: () => void;
}

let itemCounter = 1;

export const useChecklistStore = create<ChecklistState>((set) => ({
  items: [],
  activeType: 'Smoke',
  setActiveType: (type) => set({ activeType: type }),
  loadTemplate: (type) => {
    const templateItems = TEMPLATES[type] || [];
    const items: ChecklistItem[] = templateItems.map((text) => ({
      id: `CL-${String(itemCounter++).padStart(3, '0')}`,
      text,
      done: false,
    }));
    set({ items, activeType: type });
  },
  addItem: (text) =>
    set((state) => ({
      items: [
        ...state.items,
        { id: `CL-${String(itemCounter++).padStart(3, '0')}`, text, done: false },
      ],
    })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  toggleItem: (id) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    })),
  clearItems: () => {
    itemCounter = 1;
    set({ items: [] });
  },
}));

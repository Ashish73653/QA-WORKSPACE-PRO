import { useState } from 'react';
import { Sparkles, Copy, Play, Wand2, Loader2, Download } from 'lucide-react';
import { useAiStore, callAi } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import { usePlaywrightStore } from '../../store/playwrightStore';
import '../pages.css';

function generateBdd(userStory: string, criteria: string, locatorHint: string) {
  const criteriaLines = criteria.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const featureName = userStory.match(/I want to (.+?) so that/i)?.[1] || 'Feature Under Test';
  const role = userStory.match(/As (?:a |an )(.+?) I/i)?.[1] || 'user';

  let featureText = `@feature\nFeature: ${featureName}\n  As a ${role}\n  ${userStory.trim()}\n\n`;
  criteriaLines.forEach((criterion, i) => {
    const tag = i === 0 ? '@smoke @priority-high' : '@regression';
    featureText += `  ${tag}\n  Scenario: ${criterion}\n    Given the user is on the application page\n    When the user performs the action for "${criterion}"\n    Then the expected outcome should be verified\n\n`;
  });

  let stepDefText = `import { Given, When, Then } from '@cucumber/cucumber';\nimport { expect, type Page } from '@playwright/test';\n\nlet page: Page;\n\n`;
  stepDefText += `Given('the user is on the application page', async function () {\n  await page.goto('/');\n  await page.waitForLoadState('domcontentloaded');\n});\n\n`;
  criteriaLines.forEach((criterion) => {
    stepDefText += `When('the user performs the action for "${criterion}"', async function () {\n  // TODO: Implement — ${criterion}\n  throw new Error('Not implemented');\n});\n\n`;
  });
  stepDefText += `Then('the expected outcome should be verified', async function () {\n  // TODO: Add assertion\n  expect(true).toBeTruthy();\n});\n`;

  let locatorSuggestions = `// ═══ Playwright Locator Strategy Guide ═══\n\n`;
  locatorSuggestions += `// 1. PREFERRED: Role-based (most resilient to UI changes)\n`;
  locatorSuggestions += `page.getByRole('button', { name: 'Submit' })\n`;
  locatorSuggestions += `page.getByRole('textbox', { name: 'Email' })\n`;
  locatorSuggestions += `page.getByRole('link', { name: 'Sign In' })\n`;
  locatorSuggestions += `page.getByRole('heading', { name: 'Welcome' })\n\n`;
  locatorSuggestions += `// 2. GOOD: Text & label based\n`;
  locatorSuggestions += `page.getByText('Welcome back')\n`;
  locatorSuggestions += `page.getByLabel('Password')\n`;
  locatorSuggestions += `page.getByPlaceholder('Enter your email')\n`;
  locatorSuggestions += `page.getByTitle('User settings')\n\n`;
  locatorSuggestions += `// 3. RECOMMENDED: Test ID (add data-testid to your HTML)\n`;
  locatorSuggestions += `page.locator('[data-testid="submit-btn"]')\n`;
  locatorSuggestions += `page.locator('[data-testid="email-input"]')\n\n`;
  if (locatorHint) {
    locatorSuggestions += `// 4. YOUR CUSTOM SELECTOR\npage.locator('${locatorHint}')\n\n`;
  }
  locatorSuggestions += `// 5. FALLBACK: CSS Selector\npage.locator('.login-form button[type="submit"]')\n\n`;
  locatorSuggestions += `// 6. LAST RESORT: XPath\npage.locator('//button[contains(text(), "Submit")]')\n`;

  const className = featureName.replace(/[^a-zA-Z]/g, '') + 'Page';
  let pomClass = `import { type Page, type Locator } from '@playwright/test';\n\n`;
  pomClass += `export class ${className} {\n  readonly page: Page;\n\n`;
  pomClass += `  // ── Locators ──\n`;
  pomClass += `  // Define your locators here\n\n`;
  pomClass += `  constructor(page: Page) {\n    this.page = page;\n  }\n\n`;
  pomClass += `  async navigate(): Promise<void> {\n    await this.page.goto('/');\n    await this.page.waitForLoadState('domcontentloaded');\n  }\n\n`;
  criteriaLines.forEach((criterion) => {
    const methodName = criterion.replace(/[^a-zA-Z\s]/g, '').split(' ').map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join('').substring(0, 40);
    pomClass += `  async ${methodName}(): Promise<void> {\n    // TODO: Implement — ${criterion}\n    throw new Error('Not implemented');\n  }\n\n`;
  });
  pomClass += `}\n`;

  return { featureText, stepDefText, locatorSuggestions, pomClass };
}

export function PlaywrightBuilder() {
  const storedUserStory = usePlaywrightStore((s) => s.userStory);
  const storedCriteria = usePlaywrightStore((s) => s.criteria);
  const storedLocatorHint = usePlaywrightStore((s) => s.locatorHint);
  const storedGenerated = usePlaywrightStore((s) => s.generated);
  const setStoredUserStory = usePlaywrightStore((s) => s.setUserStory);
  const setStoredCriteria = usePlaywrightStore((s) => s.setCriteria);
  const setStoredLocatorHint = usePlaywrightStore((s) => s.setLocatorHint);
  const setStoredGenerated = usePlaywrightStore((s) => s.setGenerated);

  const [userStory, setUserStory] = useState(storedUserStory);
  const [criteria, setCriteria] = useState(storedCriteria);
  const [locatorHint, setLocatorHint] = useState(storedLocatorHint);
  const [activeTab, setActiveTab] = useState<'feature' | 'steps' | 'locators' | 'pom'>('feature');
  const [generated, setGenerated] = useState<ReturnType<typeof generateBdd> | null>(storedGenerated);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isAiConfigured = useAiStore((s) => s.isConfigured);
  const openSettings = useAiStore((s) => s.openSettings);
  const addToast = useToastStore((s) => s.addToast);

  const handleGenerate = () => {
    if (!userStory.trim() || !criteria.trim()) return;
    const generatedBundle = generateBdd(userStory, criteria, locatorHint);
    setGenerated(generatedBundle);
    setStoredGenerated(generatedBundle);
    setActiveTab('feature');
    addToast({ type: 'success', title: 'BDD artifacts generated', message: 'Feature file, step definitions, locators, and POM class created.' });
  };

  const handleAiGenerate = async () => {
    if (!userStory.trim() || !criteria.trim()) return;
    if (!isAiConfigured) { openSettings(); return; }

    setIsAiLoading(true);
    try {
      const response = await callAi({
        systemPrompt: `You are an expert Playwright BDD automation engineer. Given a user story and acceptance criteria, generate production-ready BDD artifacts. Return a JSON object with these keys:
- featureText: Complete Gherkin .feature file with @tags, Feature, Background, and detailed Scenarios with Given/When/Then/And steps
- stepDefText: TypeScript step definition file with proper imports, page setup, and real assertion patterns
- locatorSuggestions: Commented TypeScript showing best Playwright locator strategies for this feature
- pomClass: Complete Page Object Model class with typed locators and methods

Make the output realistic, production-ready, and follow Playwright best practices. Do not wrap in markdown code blocks.`,
        userPrompt: `User Story: ${userStory}\n\nAcceptance Criteria:\n${criteria}\n\n${locatorHint ? `Locator Hint: ${locatorHint}` : ''}`,
      });

      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        const generatedBundle = {
          featureText: parsed.featureText || '',
          stepDefText: parsed.stepDefText || '',
          locatorSuggestions: parsed.locatorSuggestions || '',
          pomClass: parsed.pomClass || '',
        };
        setGenerated(generatedBundle);
        setStoredGenerated(generatedBundle);
        addToast({ type: 'success', title: 'AI BDD artifacts generated', message: 'Production-ready Playwright automation artifacts created.' });
      } catch {
        // If JSON parse fails, use the raw response as feature text
        const generatedBundle = {
          featureText: cleaned,
          stepDefText: '// AI response could not be parsed as JSON. Raw output shown in Feature tab.',
          locatorSuggestions: '',
          pomClass: '',
        };
        setGenerated(generatedBundle);
        setStoredGenerated(generatedBundle);
        addToast({ type: 'warning', title: 'Partial AI output', message: 'Response shown in Feature tab — could not split into separate artifacts.' });
      }
      setActiveTab('feature');
    } catch (err: any) {
      addToast({ type: 'error', title: 'AI generation failed', message: err.message });
    } finally {
      setIsAiLoading(false);
    }
  };

  const getActiveCode = () => {
    if (!generated) return '';
    switch (activeTab) {
      case 'feature': return generated.featureText;
      case 'steps': return generated.stepDefText;
      case 'locators': return generated.locatorSuggestions;
      case 'pom': return generated.pomClass;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied to clipboard' });
  };

  const handleDownload = (content: string, ext: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: `File downloaded`, message: `feature.${ext} saved.` });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Playwright Spec Builder</h1>
        <p className="page-subtitle">
          Generate BDD feature files, step definitions, locator suggestions, and POM stubs from user stories.
        </p>
      </div>

      <div className="grid-2">
        {/* Input */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">User Story Input</h2></div>
          <div className="form-group">
            <label className="form-label">User Story</label>
            <textarea className="form-textarea" value={userStory} onChange={(e) => { const next = e.target.value; setUserStory(next); setStoredUserStory(next); }}
              placeholder="As a registered user I want to reset my password so that I can regain access to my account" rows={3} id="bdd-story" />
          </div>
          <div className="form-group">
            <label className="form-label">Acceptance Criteria (one per line)</label>
            <textarea className="form-textarea" value={criteria} onChange={(e) => { const next = e.target.value; setCriteria(next); setStoredCriteria(next); }}
              placeholder={"User can click 'Forgot Password' link\nUser receives reset email within 60 seconds\nReset link expires after 24 hours\nUser can set a new password meeting requirements"} rows={5} id="bdd-criteria" />
          </div>
          <div className="form-group">
            <label className="form-label">Locator Hint (optional)</label>
            <input className="form-input" value={locatorHint} onChange={(e) => { const next = e.target.value; setLocatorHint(next); setStoredLocatorHint(next); }} placeholder="e.g., #login-form .submit-btn" id="bdd-locator" />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={!userStory.trim() || !criteria.trim()}>
              <Sparkles size={16} /> Generate
            </button>
            <button className="btn btn-secondary" onClick={handleAiGenerate} disabled={isAiLoading || !userStory.trim() || !criteria.trim()}
              style={isAiConfigured ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}>
              {isAiLoading ? <><Loader2 size={16} className="spin-icon" /> Generating...</> : <><Wand2 size={16} /> AI Generate</>}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Generated Output</h2>
            {generated && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-sm btn-ghost" onClick={() => handleCopy(getActiveCode())}><Copy size={14} /> Copy</button>
                {activeTab === 'feature' && <button className="btn btn-sm btn-ghost" onClick={() => handleDownload(generated.featureText, 'feature')}><Download size={14} /> .feature</button>}
                {activeTab === 'steps' && <button className="btn btn-sm btn-ghost" onClick={() => handleDownload(generated.stepDefText, 'ts')}><Download size={14} /> .ts</button>}
              </div>
            )}
          </div>

          {generated ? (
            <>
              <div className="tabs">
                <button className={`tab ${activeTab === 'feature' ? 'active' : ''}`} onClick={() => setActiveTab('feature')}>Feature File</button>
                <button className={`tab ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}>Step Definitions</button>
                <button className={`tab ${activeTab === 'locators' ? 'active' : ''}`} onClick={() => setActiveTab('locators')}>Locators</button>
                <button className={`tab ${activeTab === 'pom' ? 'active' : ''}`} onClick={() => setActiveTab('pom')}>Page Object</button>
              </div>
              <div className="code-block-header">
                <span className="code-block-lang">{activeTab === 'feature' ? 'gherkin' : 'typescript'}</span>
                <button className="copy-btn" onClick={() => handleCopy(getActiveCode())}><Copy size={12} /> Copy</button>
              </div>
              <div className="code-block">{getActiveCode()}</div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <Play size={40} className="empty-state-icon" />
              <p className="empty-state-title">No artifacts generated</p>
              <p className="empty-state-text">Enter a user story and acceptance criteria to generate BDD artifacts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

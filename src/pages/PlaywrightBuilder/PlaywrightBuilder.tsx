import { useState } from 'react';
import { Copy, Play, Wand2, Loader2, Download } from 'lucide-react';
import { useAiStore, callAi } from '../../store/aiStore';
import { useToastStore } from '../../store/toastStore';
import { usePlaywrightStore } from '../../store/playwrightStore';
import { safeJsonParse } from '../../utils/safeJson';
import { AiLoader } from '../../components/AiLoader/AiLoader';
import '../pages.css';

interface GeneratedBundle {
  featureText: string;
  stepDefText: string;
  locatorSuggestions: string;
  pomClass: string;
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
  const [generated, setGenerated] = useState<GeneratedBundle | null>(storedGenerated);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isAiConfigured = useAiStore((s) => s.isConfigured);
  const openSettings = useAiStore((s) => s.openSettings);
  const addToast = useToastStore((s) => s.addToast);

  const handleGenerate = async () => {
    if (!userStory.trim() || !criteria.trim()) return;
    if (!isAiConfigured) { openSettings(); return; }

    setIsAiLoading(true);
    try {
      const response = await callAi({
        systemPrompt: `You are an expert Playwright + Cucumber BDD automation engineer. Given a user story and acceptance criteria, generate production-ready BDD automation artifacts.

Return a JSON object with exactly these 4 keys (no markdown, no code fences):

1. "featureText": A complete Gherkin .feature file with:
   - @tags for each scenario (e.g., @smoke, @regression, @critical)
   - Feature description with As a/I want/So that
   - Background section if common preconditions exist
   - Multiple Scenarios with detailed Given/When/Then/And steps
   - Use concrete values, not vague descriptions
   - Include at least one Scenario Outline with Examples table

2. "stepDefText": TypeScript step definition file with:
   - Proper imports from @cucumber/cucumber and @playwright/test
   - Real page interactions (click, fill, waitFor), not empty stubs
   - Assertions using expect() with meaningful checks
   - Async/await patterns throughout
   - Comments explaining complex logic

3. "locatorSuggestions": Commented TypeScript showing Playwright locator strategy:
   - Role-based locators (preferred)
   - Text/label-based locators
   - data-testid locators
   - CSS selectors as fallback
   - All locators contextual to the user story provided

4. "pomClass": Complete Page Object Model class with:
   - Typed Locator properties initialized in constructor
   - Action methods for each user interaction
   - Assertion helper methods
   - Navigate method
   - All methods async with proper return types

Make ALL output realistic, production-ready, and following Playwright best practices.`,
        userPrompt: `User Story: ${userStory}\n\nAcceptance Criteria:\n${criteria}\n\n${locatorHint ? `Locator Hint: ${locatorHint}` : ''}`,
      });

      const parsed = safeJsonParse<any>(response, null);
      if (parsed) {
        const generatedBundle: GeneratedBundle = {
          featureText: parsed.featureText || '',
          stepDefText: parsed.stepDefText || '',
          locatorSuggestions: parsed.locatorSuggestions || '',
          pomClass: parsed.pomClass || '',
        };
        setGenerated(generatedBundle);
        setStoredGenerated(generatedBundle);
        addToast({ type: 'success', title: 'BDD artifacts generated', message: 'Feature file, step definitions, locators, and POM class created.' });
      } else {
        const generatedBundle: GeneratedBundle = {
          featureText: response,
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
      if (err.message === 'AI_NOT_CONFIGURED') { openSettings(); }
      else { addToast({ type: 'error', title: 'Generation failed', message: err.message }); }
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={isAiLoading || !userStory.trim() || !criteria.trim()}>
              {isAiLoading ? <><Loader2 size={16} className="spin-icon" /> Generating...</> : <><Wand2 size={16} /> Generate Specs</>}
            </button>
            {!isAiConfigured && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                Configure AI key to generate
              </span>
            )}
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

          {isAiLoading ? (
            <div style={{ padding: '60px 0' }}>
              <AiLoader message="Generating Playwright specs..." subMessage="Writing feature file, steps, and Page Object Model" />
            </div>
          ) : generated ? (
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

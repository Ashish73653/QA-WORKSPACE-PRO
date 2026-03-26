# Implementation Roadmap (SRS v1.0)

## Phase 0: Setup and Architecture (Week 1)

- Finalize RTM and sprint-ready backlog.
- Scaffold frontend-only SPA project structure.
- Define module contracts and shared state schema.
- Configure lint, unit test, and build pipeline.

Deliverables:

- Approved RTM baseline
- Working app shell with tab navigation
- CI checks for lint/test/build

## Phase 1: Core Utility Modules (Weeks 2-3)

- Shared Context + Case Formatter
- Checklist Builder
- Boundary Calculator
- Equivalence Partitioner

Deliverables:

- Core case hub working with generated inputs
- Send-to-Cases integration from BVA and EP modules
- Basic in-session state continuity

## Phase 2: Visual and Export Layer (Weeks 4-5)

- Coverage Heatmap UI
- Unified Export assembler (`.txt`, `.docx`, clipboard)
- Export sections for all completed modules

Deliverables:

- Test plan export with project header, cases, checklist, coverage, BVA, EP
- Cross-tab export button available globally

## Phase 3: Automation and QA Intelligence (Weeks 6-7)

- Playwright Spec Builder
- Defect DNA Analyzer
- SQL Test Data Generator
- CI/CD Test Health Dashboard

Deliverables:

- Feature/step-def/POM artifact generation
- Defect scoring + formatted JIRA output
- SQL and CI analysis outputs included in export

## Phase 4: NFR Hardening and Release (Week 8)

- Performance tuning against SRS thresholds
- Cross-browser verification
- Graceful error handling for malformed SQL/JSON
- Release candidate validation and sign-off

Deliverables:

- Performance report (500ms interactions, <2s export for 200 cases)
- Browser compatibility sign-off
- v1.0 release package

## Governance Cadence

- Daily: stand-up and blocker review
- Weekly: backlog refinement and risk review
- Bi-weekly: sprint demo and retrospective

## KPI Starter Set

- Requirement coverage percentage (RTM complete)
- Module completion percentage (9/9)
- Performance pass rate against NFR thresholds
- Export completeness score (all required sections present)
- Defect escape count from UAT

## Exit Criteria for MVP

- 100% of P0 requirements implemented
- All P0 acceptance tests pass
- All module outputs included in export
- No app crash on malformed SQL/JSON input
- Browser compatibility verified on Chrome/Firefox/Edge

## Status Snapshot (March 26, 2026)

- Phase 0: Partially complete (app shell/build/lint in place; CI test workflow still pending)
- Phase 1: Complete
- Phase 2: Complete
- Phase 3: Complete
- Phase 4: Not started

### Phase 3 Completion Notes

- Playwright Spec Builder implemented (feature, steps, locators, POM outputs)
- Defect DNA Analyzer implemented (8-dimension scoring + JIRA-ready output)
- SQL Test Data Generator implemented (valid/invalid rows + verification queries)
- CI/CD Dashboard implemented (JSON parsing, flaky detection, standup summary)
- Unified export now includes Defect, Playwright, SQL, and CI sections

### Phase 2 Completion Notes

- Coverage Heatmap UI implemented
- Unified export supports `.txt`, `.docx`, and clipboard
- Export sections include all currently completed modules

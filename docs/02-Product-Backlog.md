# Product Backlog (SRS v1.0 Aligned)

## Prioritization Model

- P0: Must ship in MVP
- P1: Should ship after MVP or if capacity allows
- P2: Deferred enhancements

## Epics and Stories

### Epic E1: Shared Context and Core Case Hub

| Story ID | User Story                                                             | Priority | Acceptance Criteria                                                 | Dependencies |
| -------- | ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- | ------------ |
| E1-S1    | As a tester, I set project context once and use it across all modules. | P0       | Header updates instantly reflect in module outputs and export.      | None         |
| E1-S2    | As a tester, I convert rough notes to structured cases quickly.        | P0       | Note splitter maps each item to one case row with required columns. | E1-S1        |
| E1-S3    | As a tester, I track execution status summary in real time.            | P0       | Total/pass/fail/skip counters are always accurate.                  | E1-S2        |

### Epic E2: Planning Accelerators

| Story ID | User Story                                                                 | Priority | Acceptance Criteria                                         | Dependencies |
| -------- | -------------------------------------------------------------------------- | -------- | ----------------------------------------------------------- | ------------ |
| E2-S1    | As a tester, I generate smoke/sanity/regression checklists from templates. | P0       | 6-10 starter items load per checklist type.                 | E1-S1        |
| E2-S2    | As a tester, I tailor checklist items for my sprint.                       | P0       | Add/remove/toggle item works and state persists in session. | E2-S1        |
| E2-S3    | As a lead, I view coverage by feature area in a heatmap.                   | P1       | Color coding follows 0/1-2/3-5/6+ rules.                    | E1-S2        |

### Epic E3: Test Design Generators

| Story ID | User Story                                                              | Priority | Acceptance Criteria                                        | Dependencies |
| -------- | ----------------------------------------------------------------------- | -------- | ---------------------------------------------------------- | ------------ |
| E3-S1    | As a tester, I generate 7 boundary values with valid/invalid labels.    | P0       | Generated set matches SRS boundary logic.                  | E1-S2        |
| E3-S2    | As a tester, I send boundary outputs directly to case formatter.        | P0       | Send action appends cases to Case Formatter.               | E3-S1        |
| E3-S3    | As a tester, I create equivalence partitions from plain-language rules. | P0       | Valid/Invalid/Edge partitions with examples are generated. | E1-S2        |
| E3-S4    | As a tester, I push equivalence partitions into case formatter.         | P0       | Send action appends partition-based cases correctly.       | E3-S3        |

### Epic E4: Automation Artifact Builder

| Story ID | User Story                                                                  | Priority | Acceptance Criteria                                          | Dependencies |
| -------- | --------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ | ------------ |
| E4-S1    | As an automation tester, I generate BDD scenarios from acceptance criteria. | P0       | One criterion line yields one scenario.                      | E1-S1        |
| E4-S2    | As an automation tester, I generate TypeScript step definition stubs.       | P0       | Step text and function stubs align with scenarios.           | E4-S1        |
| E4-S3    | As an automation tester, I get locator suggestions and POM stub output.     | P0       | Includes role/text/data-testid/XPath and page class methods. | E4-S1        |

### Epic E5: Quality Intelligence Modules

| Story ID | User Story                                                                  | Priority | Acceptance Criteria                                      | Dependencies |
| -------- | --------------------------------------------------------------------------- | -------- | -------------------------------------------------------- | ------------ |
| E5-S1    | As a tester, I score defect quality against 8 dimensions.                   | P0       | Score and missing fields display clearly.                | E1-S1        |
| E5-S2    | As a tester, I generate a JIRA-ready defect report block.                   | P0       | Output includes all required defect fields and sections. | E5-S1        |
| E5-S3    | As a tester, I generate SQL test rows and verification queries from schema. | P0       | Valid/invalid INSERT and SELECT outputs are generated.   | E1-S1        |
| E5-S4    | As a tester, I parse Playwright JSON to get health summary and fix queue.   | P0       | Totals, suites, and fix ordering are shown.              | E1-S1        |
| E5-S5    | As a lead, I identify flaky tests by comparing two runs.                    | P1       | Flaky list highlights changed test statuses.             | E5-S4        |

### Epic E6: Unified Export

| Story ID | User Story                                                                  | Priority | Acceptance Criteria                                               | Dependencies |
| -------- | --------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- | ------------ |
| E6-S1    | As a lead, I export a complete test plan from all modules in one click.     | P0       | Export contains every required section from SRS section 4.        | E1-E5        |
| E6-S2    | As a user, I can export in `.txt` and `.docx` formats or copy to clipboard. | P0       | All three export methods are available and produce usable output. | E6-S1        |

## MVP Candidate Stories (SRS v1.0)

- E1-S1, E1-S2, E1-S3
- E2-S1, E2-S2
- E3-S1, E3-S2, E3-S3, E3-S4
- E4-S1, E4-S2, E4-S3
- E5-S1, E5-S2, E5-S3, E5-S4
- E6-S1, E6-S2

## Post-MVP / v1.1 Candidates

- E2-S3 auto-derive heatmap counts from case tags
- E5-S5 flaky detection enhancements and historical trend view

## Backlog Grooming Checklist

1. Confirm each story maps to one or more SRS requirements.
2. Add story points and target sprint.
3. Confirm acceptance criteria is testable.
4. Resolve cross-team dependencies.

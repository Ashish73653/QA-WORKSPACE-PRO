# VeriFlow

A comprehensive single-page QA productivity workspace that combines planning, test design, automation artifact generation, defect analysis, test data generation, CI health monitoring, and unified export—all in one integrated platform.

## Project Overview

VeriFlow is a modern, full-featured React/TypeScript application designed to streamline QA workflows by providing a suite of specialized tools for test professionals. With shared project context across all modules, intelligent data bridges, and one-click consolidated export, teams can seamlessly move from test case design through automation and quality analysis.

## Core Features & Modules

### 1. **Case Formatter**

- Structured test case table with formatted data entry
- Status tracking and progress indicators
- Central data hub for shared project context

### 2. **Checklist Builder**

- Pre-built templates for common QA scenarios
- Progress tracking and completion metrics
- Task management and organization

### 3. **Coverage Heatmap**

- Visual representation of test coverage levels
- Risk-based coverage analysis
- Color-coded severity indicators

### 4. **Boundary Value Calculator**

- Automatic BVA test generation
- 7 standard boundary test values
- Data-driven test scenario generation

### 5. **Equivalence Partitioner**

- Valid, invalid, and edge case partitioning
- Class-based test data organization
- Automated partition generation

### 6. **Playwright Spec Builder**

- BDD specification generation (Given-When-Then)
- Step definitions and locators
- Page Object Model (POM) stubs
- Test automation artifact creation

### 7. **Defect DNA Analyzer**

- 8-dimensional quality scoring system
- Defect root cause analysis
- JIRA-ready formatted reports
- Quality metrics dashboard

### 8. **SQL Test Data Generator**

- CREATE TABLE schema parsing
- Intelligent test data generation
- SQL INSERT statement generation

### 9. **CI/CD Test Health Dashboard**

- Playwright JSON results parsing
- Test execution health analysis
- Failed test prioritization queue
- Build quality metrics

### 10. **Documentation Hub**

- Centralized documentation repository
- Quick reference guides
- Best practices and workflows

## Unified Export

Aggregate all module outputs into a comprehensive report with these output formats:

- `.txt` download
- `.docx` download
- Copy to clipboard

Export includes:

- Project header and context
- Test cases and test data
- Coverage summary and heatmap
- Boundary and equivalence test values
- BDD specifications
- Defect analysis and quality reports
- SQL test data sets and verification queries
- CI/CD health summaries

## Tech Stack

| Layer                | Technology                 |
| -------------------- | -------------------------- |
| **Framework**        | React 19                   |
| **Language**         | TypeScript 5.7             |
| **Build Tool**       | Vite 6                     |
| **State Management** | Zustand 5                  |
| **UI Icons**         | Lucide React               |
| **Linting**          | ESLint + TypeScript ESLint |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AiSettings/     # AI configuration panel
│   ├── Sidebar/        # Navigation and module selector
│   ├── Topbar/         # Header with project context
│   └── Toast/          # Notification system
├── pages/              # Feature modules (tools)
│   ├── BoundaryCalculator/
│   ├── CaseFormatter/
│   ├── ChecklistBuilder/
│   ├── CiDashboard/
│   ├── CoverageHeatmap/
│   ├── DefectAnalyzer/
│   ├── DocumentationHub/
│   ├── EquivalencePartitioner/
│   ├── PlaywrightBuilder/
│   └── SqlGenerator/
├── store/              # Zustand state stores
│   ├── aiStore.ts
│   ├── appStore.ts
│   ├── caseStore.ts
│   ├── ciStore.ts
│   ├── checklistStore.ts
│   ├── defectStore.ts
│   ├── heatmapStore.ts
│   ├── playwrightStore.ts
│   ├── sqlStore.ts
│   └── toastStore.ts
├── utils/              # Utility functions
│   └── exportAssembler.ts
└── App.tsx             # Main application entry point
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Modern web browser (Chrome, Firefox, Edge)

### Installation

```bash
# Clone and navigate to project
cd QA-WORKSPACE-PRO

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## Performance & Non-Functional Requirements

- **Response Time**: Module outputs generated in ≤ 500ms
- **Export Speed**: Consolidated export generated in ≤ 2 seconds (up to 200 test cases)
- **Error Handling**: Graceful error handling for malformed SQL/JSON inputs
- **Browser Support**: Latest Chrome, Firefox, and Edge versions
- **Minimum Resolution**: 1024px width (laptop/desktop optimized)
- **Usability**: Clear placeholders and user-friendly error messages

## Implementation Status (March 2026)

- Phase 0: Partially complete (build/lint/app shell done; CI test workflow pending)
- Phase 1: Complete
- Phase 2: Complete
- Phase 3: Complete
- Phase 4: Not started

## Architecture Highlights

- **Shared Context**: Unified state management across all modules via Zustand stores
- **Data Bridges**: Smart inter-module communication for seamless workflows (e.g., Boundary/Equivalence → Case Formatter)
- **Component-Based**: Modular architecture with reusable components and pages
- **Type-Safe**: Full TypeScript support for development confidence
- **Modern UI**: Clean, professional interface using Lucide React icons

## Documentation

Comprehensive project documentation is available in the `docs/` directory:

- [Execution Blueprint](docs/00-Execution-Blueprint.md) - Development roadmap and execution plan
- [Requirement Traceability Matrix](docs/01-Requirement-Traceability-Matrix.md) - Requirements mapping
- [Product Backlog](docs/02-Product-Backlog.md) - Feature backlog and prioritization
- [Implementation Roadmap](docs/03-Implementation-Roadmap.md) - Development timeline
- [SRS Requirement Summary](docs/04-SRS-Requirement-Summary.md) - Full specification overview
- [SRS Document](docs/srsforQAWorkSpace.txt) - Complete requirements documentation

## Version

Version: 1.0.0 (March 2026)

## License

[Add your license information here]

---

**VeriFlow** - From test ideas to execution - all in one flow.

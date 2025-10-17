# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **Speckit** repository - a specification-driven development workflow that transforms feature descriptions into structured, executable implementation plans. The workflow progresses through specification → planning → task generation → implementation phases, with constitution-based governance ensuring consistency and quality.

## Core Workflow Commands

All workflow commands are namespaced under `/speckit.`:

### Feature Specification
- `/speckit.specify <feature-description>` - Create feature spec from natural language description
  - Creates feature branch and `specs/<feature>/spec.md`
  - Generates spec using `.specify/templates/spec-template.md`
  - Validates completeness with automated quality checklist
  - Limits clarifications to max 3 critical questions

### Implementation Planning
- `/speckit.plan` - Generate implementation plan with tech stack and architecture
  - **Phase 0**: Research unknowns, resolve NEEDS CLARIFICATION markers
  - **Phase 1**: Generate `data-model.md`, `contracts/`, `quickstart.md`
  - Updates agent context automatically
  - Validates against constitution rules

### Task Generation
- `/speckit.tasks` - Generate dependency-ordered task list from design artifacts
  - Organizes tasks by user story priority (P1, P2, P3)
  - Each story is independently testable and deployable
  - Uses checklist format: `- [ ] [T###] [P?] [Story?] Description with file path`
  - Creates parallel execution opportunities

### Implementation Execution
- `/speckit.implement` - Execute all tasks from `tasks.md`
  - Validates checklists before proceeding
  - Follows TDD approach (tests before implementation)
  - Respects task dependencies and parallel markers
  - Updates ignore files (`.gitignore`, `.dockerignore`, etc.)

### Quality & Refinement
- `/speckit.clarify` - Identify underspecified areas and gather targeted clarifications
- `/speckit.analyze` - Cross-artifact consistency and quality analysis
- `/speckit.checklist` - Generate custom checklist for current feature
- `/speckit.constitution` - Create or update project constitution

## Key Bash Scripts

Located in `.specify/scripts/bash/`:

- `create-new-feature.sh --json --short-name <name> "<description>"` - Initialize feature branch and spec file
- `check-prerequisites.sh --json [--require-tasks] [--include-tasks]` - Validate workflow prerequisites
- `setup-plan.sh --json` - Initialize planning phase
- `update-agent-context.sh claude` - Update Claude-specific context with tech stack from plan

All scripts support `--json` flag for structured output parsing.

## Repository Structure

```
.specify/
├── memory/
│   └── constitution.md         # Project governance rules and principles
├── scripts/bash/               # Workflow automation scripts
└── templates/                  # Templates for all artifacts
    ├── spec-template.md        # Feature specification structure
    ├── plan-template.md        # Implementation plan structure
    ├── tasks-template.md       # Task breakdown structure
    └── checklist-template.md   # Quality checklist structure

specs/<feature-id>/             # Generated per feature
├── spec.md                     # What users need (technology-agnostic)
├── plan.md                     # How to build it (tech stack, structure)
├── tasks.md                    # Actionable implementation steps
├── research.md                 # Technical decisions and rationale
├── data-model.md               # Entities and relationships
├── quickstart.md               # Integration scenarios
├── contracts/                  # API specifications
└── checklists/                 # Quality validation checklists
```

## Critical Workflow Rules

### Specification Phase
- **Technology-agnostic**: No frameworks, languages, or implementation details in spec.md
- **User-focused**: Written for business stakeholders, not developers
- **Testable requirements**: Every requirement must be measurable and unambiguous
- **Limited clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers per spec
- **Success criteria**: Must be measurable, technology-agnostic outcomes

### Planning Phase
- **Constitution compliance**: All designs must pass constitution gates
- **Research first**: Resolve all unknowns in Phase 0 before design in Phase 1
- **Agent context updates**: Automatically keep AI context in sync with tech decisions

### Task Generation
- **User story organization**: Tasks grouped by priority (P1, P2, P3)
- **Independent testability**: Each story is self-contained and deployable
- **Strict checklist format**: `- [ ] [T###] [P?] [US#?] Description with file/path`
- **Parallel markers [P]**: Indicate tasks that can run concurrently

### Implementation Phase
- **TDD approach**: Tests written before implementation (if requested)
- **Checklist validation**: All checklists must pass before implementation
- **Sequential by default**: Only parallel-marked tasks run concurrently
- **Progress tracking**: Mark tasks as [X] upon completion

## Key Principles

1. **Specification drives everything** - Start with user needs, not technical solutions
2. **Independent deliverables** - Each user story is a complete, testable increment
3. **Constitution as arbiter** - Project governance rules supersede ad-hoc decisions
4. **Automated validation** - Quality checks prevent incomplete or inconsistent artifacts
5. **Parallel execution** - Maximize concurrency where dependencies allow

## Common Patterns

### Starting a new feature
```bash
/speckit.specify Build a user authentication system with email/password login
# → Creates branch, spec.md, validates quality
/speckit.plan
# → Generates plan.md, research.md, data-model.md, contracts/
/speckit.tasks
# → Creates tasks.md with prioritized, executable tasks
/speckit.implement
# → Executes all tasks in dependency order
```

### Handling unclear requirements
- Speckit makes informed guesses based on industry standards
- Only marks critical decisions as [NEEDS CLARIFICATION]
- Clarifications limited to: scope > security > UX > technical details

### Working with checklists
- Auto-generated during `/speckit.specify` for requirements validation
- Can create custom checklists with `/speckit.checklist`
- Implementation halts if checklists incomplete (unless user overrides)

## File Path Conventions

- **Always use absolute paths** in scripts and task descriptions
- **Escape single quotes** in bash arguments: `'I'\''m Groot'` or use double quotes
- **Script execution** always from repository root

## Quality Gates

### Specification Quality
- No implementation details leak into spec.md
- All requirements testable and unambiguous
- Success criteria are measurable outcomes
- Maximum 3 unresolved clarifications

### Implementation Readiness
- All checklists complete (or explicitly bypassed)
- Constitution rules validated
- Task dependencies clearly defined
- File paths specified for all tasks

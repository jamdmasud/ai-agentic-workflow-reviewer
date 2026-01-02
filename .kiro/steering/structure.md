# Project Structure & Organization

## Directory Layout

```
src/
├── agents/           # AI agent implementations
├── app/             # Next.js App Router pages and API routes
├── components/      # React UI components
├── hooks/           # Custom React hooks
├── orchestration/   # Agent coordination and workflow management
├── types/           # TypeScript type definitions
└── utils/           # Utility functions and helpers
```

## Key Folders

### `/src/agents/`
Contains specialized AI agents for workflow analysis:
- `AIAgent.ts` - Base abstract class for AI-powered agents
- `ParserAgent.ts` - Multi-format workflow parsing (JSON/YAML/text)
- `RiskAnalyzerAgent.ts` - Risk and bottleneck detection
- `OptimizationAgent.ts` - Goal-specific improvement suggestions
- `CriticAgent.ts` - Counter-arguments and assumption challenging

### `/src/orchestration/`
Core business logic and agent coordination:
- `AnalysisEngine.ts` - Main orchestrator for multi-agent workflow
- `ResultCache.ts` - Intelligent caching system with performance optimization
- `GoalContext.ts` - Goal-specific analysis parameters and configuration
- `WorkflowAnalysisService.ts` - High-level service interface

### `/src/types/`
Comprehensive TypeScript definitions:
- `workflow.ts` - Workflow structure and parsing types
- `analysis.ts` - Analysis results and agent output types
- `goals.ts` - Optimization goal enums and parameters
- `state.ts` - Application state management types
- `index.ts` - Barrel export for all types

### `/src/components/`
React UI components with Mantine integration:
- `WorkflowInputForm.tsx` - Multi-format workflow input with validation
- `ResultsDisplay.tsx` - Organized analysis results presentation
- `GoalSelector.tsx` - Interactive goal selection interface
- `index.ts` - Barrel export for clean imports

### `/src/hooks/`
Custom React hooks for state management:
- `useApplicationState.ts` - Global application state management
- `useAIAnalysis.ts` - AI analysis workflow coordination

## Naming Conventions

### Files & Classes
- **PascalCase** for components, classes, and types: `AnalysisEngine`, `WorkflowInputForm`
- **camelCase** for functions, variables, and hooks: `analyzeWorkflow`, `useApplicationState`
- **kebab-case** for file names when multiple words: `workflow-analysis-service.ts`

### Imports & Exports
- Use **barrel exports** (`index.ts`) for clean imports
- Prefer **named exports** over default exports for better tree-shaking
- Use **path aliases** (`@/components`) instead of relative imports

### Type Definitions
- **Interface** for object shapes: `interface AnalysisResults`
- **Type** for unions and computed types: `type Goal = 'reliability' | 'cost' | 'simplicity'`
- **Enum** for fixed sets of values: `enum ProcessingStatus`

## Architecture Principles

### Separation of Concerns
- **Agents**: Domain-specific analysis logic
- **Orchestration**: Workflow coordination and caching
- **Components**: UI presentation and user interaction
- **Types**: Shared data contracts

### Error Handling
- **Network errors**: Retry logic with exponential backoff
- **Validation errors**: User-friendly messages with guidance
- **Agent failures**: Graceful degradation with partial results
- **System errors**: Comprehensive logging and recovery

### Performance Patterns
- **Component-level caching**: Reuse parsing results across goals
- **Intelligent re-analysis**: Optimize goal changes with cached components
- **Lazy loading**: Load agents and heavy dependencies on demand
- **Memory management**: Clear caches and cleanup resources appropriately

### Testing Structure
- **Unit tests**: Individual agent and utility function testing
- **Integration tests**: Multi-agent workflow coordination
- **Property-based tests**: Correctness validation across input variations
- **Performance tests**: Cache effectiveness and optimization validation
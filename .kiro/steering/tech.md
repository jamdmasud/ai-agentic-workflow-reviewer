# Technology Stack & Build System

## Core Technologies

### Frontend Framework
- **Next.js 14** with App Router (`experimental.appDir: true`)
- **React 18** with TypeScript 5.0
- **Mantine UI** component library for consistent design system

### Development Tools
- **TypeScript** with strict type checking and path aliases (`@/*` → `./src/*`)
- **ESLint** with Next.js configuration for code quality
- **Jest** with jsdom environment for testing
- **fast-check** for property-based testing

### Key Dependencies
- `js-yaml` for YAML parsing support
- `@tabler/icons-react` for consistent iconography
- `@mantine/hooks`, `@mantine/form`, `@mantine/notifications` for UI functionality

## Build Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Production build
npm start           # Start production server
```

### Testing
```bash
npm test            # Run Jest test suite
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint checks
```

## Architecture Patterns

### Multi-Agent System
- **Sequential Processing**: Parser → Risk Analyzer → Optimization → Critic
- **Intelligent Caching**: Component-level caching with hash-based lookups
- **Error Handling**: Network retry logic with exponential backoff
- **Goal-based Analysis**: Different optimization targets (Reliability, Cost, Simplicity)

### Code Organization
- **Barrel Exports**: Use `index.ts` files for clean imports
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures
- **Separation of Concerns**: Clear boundaries between agents, orchestration, and UI layers
- **Property-based Testing**: 10+ correctness properties with 1000+ validation iterations

### Performance Optimization
- **Intelligent Caching**: 2.8x performance improvement for re-analysis
- **Component-level Caching**: Parse results reusable across different goals
- **Network Error Handling**: Graceful degradation with user-friendly messages
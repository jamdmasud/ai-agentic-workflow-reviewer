// Application state management types
import { Goal } from './goals'
import { AnalysisResults } from './analysis'
import { WorkflowStructure } from './workflow'

export interface ApplicationState {
  workflow: WorkflowState
  analysis: AnalysisState
  ui: UIState
}

export interface WorkflowState {
  originalInput: string
  parsedStructure: WorkflowStructure | null
  isValid: boolean
  validationErrors: string[]
  lastModified: Date | null
}

export interface AnalysisState {
  currentGoal: Goal
  results: AnalysisResults | null
  isAnalyzing: boolean
  isReanalyzing: boolean
  analysisHistory: AnalysisHistoryEntry[]
  error: string | null
  validationError: string | null
  validationGuidance: string | null
  lastAnalyzed: Date | null
  performanceMetrics: PerformanceMetrics | null
  cacheStats: CacheStats | null
}

export interface PerformanceMetrics {
  analysisTimeMs: number
  fromCache: boolean
  cacheHitComponents: string[]
  performanceGain: number
  executedAgents: string[]
  failedAgents: string[]
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  totalHits: number
  totalMisses: number
  averageAge: number
}

export interface UIState {
  isFormDisabled: boolean
  showResults: boolean
  activeSection: string | null
  notifications: Notification[]
}

export interface AnalysisHistoryEntry {
  goal: Goal
  results: AnalysisResults
  timestamp: Date
  workflowHash: string
  performanceMetrics?: PerformanceMetrics
}

export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: Date
  dismissed: boolean
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// State actions
export type StateAction =
  | { type: 'SET_WORKFLOW_INPUT'; payload: string }
  | { type: 'SET_PARSED_WORKFLOW'; payload: WorkflowStructure }
  | { type: 'SET_WORKFLOW_VALIDATION'; payload: { isValid: boolean; errors: string[] } }
  | { type: 'SET_GOAL'; payload: Goal }
  | { type: 'START_ANALYSIS' }
  | { type: 'START_REANALYSIS' }
  | { type: 'SET_ANALYSIS_RESULTS'; payload: AnalysisResults }
  | { type: 'SET_ANALYSIS_ERROR'; payload: string }
  | { type: 'SET_VALIDATION_ERROR'; payload: { error: string | null; guidance?: string | null } }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: PerformanceMetrics }
  | { type: 'SET_CACHE_STATS'; payload: CacheStats }
  | { type: 'COMPLETE_ANALYSIS' }
  | { type: 'COMPLETE_REANALYSIS' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'dismissed'> }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'SET_ACTIVE_SECTION'; payload: string | null }
  | { type: 'RESET_STATE' }

// Initial state
export const initialState: ApplicationState = {
  workflow: {
    originalInput: '',
    parsedStructure: null,
    isValid: false,
    validationErrors: [],
    lastModified: null
  },
  analysis: {
    currentGoal: Goal.RELIABILITY,
    results: null,
    isAnalyzing: false,
    isReanalyzing: false,
    analysisHistory: [],
    error: null,
    validationError: null,
    validationGuidance: null,
    lastAnalyzed: null,
    performanceMetrics: null,
    cacheStats: null
  },
  ui: {
    isFormDisabled: false,
    showResults: false,
    activeSection: null,
    notifications: []
  }
}
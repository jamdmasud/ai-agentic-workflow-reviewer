// Application state management hook
import { useReducer, useCallback, useEffect } from 'react'
import { ApplicationState, StateAction, initialState, NotificationType, PerformanceMetrics, CacheStats } from '../types/state'
import { Goal } from '../types/goals'
import { AnalysisResults } from '../types/analysis'
import { WorkflowStructure } from '../types/workflow'

// State reducer function
function stateReducer(state: ApplicationState, action: StateAction): ApplicationState {
  switch (action.type) {
    case 'SET_WORKFLOW_INPUT':
      return {
        ...state,
        workflow: {
          ...state.workflow,
          originalInput: action.payload,
          lastModified: new Date(),
          // Reset validation when input changes
          isValid: false,
          validationErrors: []
        },
        // Reset analysis state when workflow changes
        analysis: {
          ...state.analysis,
          results: null,
          error: null,
          validationError: null,
          validationGuidance: null,
          lastAnalyzed: null
        },
        ui: {
          ...state.ui,
          showResults: false
        }
      }

    case 'SET_PARSED_WORKFLOW':
      return {
        ...state,
        workflow: {
          ...state.workflow,
          parsedStructure: action.payload,
          isValid: true,
          validationErrors: []
        }
      }

    case 'SET_WORKFLOW_VALIDATION':
      return {
        ...state,
        workflow: {
          ...state.workflow,
          isValid: action.payload.isValid,
          validationErrors: action.payload.errors
        }
      }

    case 'SET_GOAL':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          currentGoal: action.payload
        }
      }

    case 'START_ANALYSIS':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          isAnalyzing: true,
          error: null,
          validationError: null,
          validationGuidance: null
        },
        ui: {
          ...state.ui,
          isFormDisabled: true,
          showResults: false
        }
      }

    case 'START_REANALYSIS':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          isReanalyzing: true,
          error: null
        }
      }

    case 'SET_ANALYSIS_RESULTS':
      const newHistoryEntry = {
        goal: state.analysis.currentGoal,
        results: action.payload,
        timestamp: new Date(),
        workflowHash: generateWorkflowHash(state.workflow.originalInput),
        performanceMetrics: state.analysis.performanceMetrics
      }

      return {
        ...state,
        analysis: {
          ...state.analysis,
          results: action.payload,
          analysisHistory: [newHistoryEntry, ...state.analysis.analysisHistory.slice(0, 9)], // Keep last 10 entries
          lastAnalyzed: new Date()
        }
      }

    case 'SET_ANALYSIS_ERROR':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          error: action.payload
        }
      }

    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          validationError: action.payload.error,
          validationGuidance: action.payload.guidance || null
        }
      }

    case 'SET_PERFORMANCE_METRICS':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          performanceMetrics: action.payload
        }
      }

    case 'SET_CACHE_STATS':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          cacheStats: action.payload
        }
      }

    case 'COMPLETE_ANALYSIS':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          isAnalyzing: false
        },
        ui: {
          ...state.ui,
          isFormDisabled: false,
          showResults: true
        }
      }

    case 'COMPLETE_REANALYSIS':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          isReanalyzing: false
        }
      }

    case 'ADD_NOTIFICATION':
      const notification = {
        ...action.payload,
        id: generateNotificationId(),
        timestamp: new Date(),
        dismissed: false
      }

      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [notification, ...state.ui.notifications]
        }
      }

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.map(n =>
            n.id === action.payload ? { ...n, dismissed: true } : n
          )
        }
      }

    case 'SET_ACTIVE_SECTION':
      return {
        ...state,
        ui: {
          ...state.ui,
          activeSection: action.payload
        }
      }

    case 'RESET_STATE':
      return initialState

    default:
      return state
  }
}

// Utility functions
function generateWorkflowHash(workflow: string): string {
  // Simple hash function for workflow content
  let hash = 0
  for (let i = 0; i < workflow.length; i++) {
    const char = workflow.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

function generateNotificationId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Custom hook for application state management
export function useApplicationState() {
  const [state, dispatch] = useReducer(stateReducer, initialState)

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const activeNotifications = state.ui.notifications.filter(n => !n.dismissed)
    
    if (activeNotifications.length > 0) {
      const timer = setTimeout(() => {
        const oldestNotification = activeNotifications[activeNotifications.length - 1]
        if (oldestNotification) {
          dispatch({ type: 'DISMISS_NOTIFICATION', payload: oldestNotification.id })
        }
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [state.ui.notifications])

  // Action creators
  const actions = {
    setWorkflowInput: useCallback((input: string) => {
      dispatch({ type: 'SET_WORKFLOW_INPUT', payload: input })
    }, []),

    setParsedWorkflow: useCallback((workflow: WorkflowStructure) => {
      dispatch({ type: 'SET_PARSED_WORKFLOW', payload: workflow })
    }, []),

    setWorkflowValidation: useCallback((isValid: boolean, errors: string[] = []) => {
      dispatch({ type: 'SET_WORKFLOW_VALIDATION', payload: { isValid, errors } })
    }, []),

    setGoal: useCallback((goal: Goal) => {
      dispatch({ type: 'SET_GOAL', payload: goal })
    }, []),

    startAnalysis: useCallback(() => {
      dispatch({ type: 'START_ANALYSIS' })
    }, []),

    startReanalysis: useCallback(() => {
      dispatch({ type: 'START_REANALYSIS' })
    }, []),

    setAnalysisResults: useCallback((results: AnalysisResults) => {
      dispatch({ type: 'SET_ANALYSIS_RESULTS', payload: results })
    }, []),

    setAnalysisError: useCallback((error: string) => {
      dispatch({ type: 'SET_ANALYSIS_ERROR', payload: error })
    }, []),

    setValidationError: useCallback((error: string | null, guidance?: string | null) => {
      dispatch({ type: 'SET_VALIDATION_ERROR', payload: { error, guidance } })
    }, []),

    setPerformanceMetrics: useCallback((metrics: PerformanceMetrics) => {
      dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: metrics })
    }, []),

    setCacheStats: useCallback((stats: CacheStats) => {
      dispatch({ type: 'SET_CACHE_STATS', payload: stats })
    }, []),

    completeAnalysis: useCallback(() => {
      dispatch({ type: 'COMPLETE_ANALYSIS' })
    }, []),

    completeReanalysis: useCallback(() => {
      dispatch({ type: 'COMPLETE_REANALYSIS' })
    }, []),

    addNotification: useCallback((type: NotificationType, message: string) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type, message } })
    }, []),

    dismissNotification: useCallback((id: string) => {
      dispatch({ type: 'DISMISS_NOTIFICATION', payload: id })
    }, []),

    setActiveSection: useCallback((section: string | null) => {
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: section })
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' })
    }, [])
  }

  return {
    state,
    actions
  }
}

// Selector hooks for specific state slices
export function useWorkflowState() {
  const { state } = useApplicationState()
  return state.workflow
}

export function useAnalysisState() {
  const { state } = useApplicationState()
  return state.analysis
}

export function useUIState() {
  const { state } = useApplicationState()
  return state.ui
}
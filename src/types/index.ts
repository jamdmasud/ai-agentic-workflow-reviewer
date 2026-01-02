// Central export file for all types
export * from './workflow'
export * from './analysis'
export * from './goals'
export * from './state'

// Additional shared types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ProcessingStatus {
  stage: string
  progress: number
  message: string
  completed: boolean
}
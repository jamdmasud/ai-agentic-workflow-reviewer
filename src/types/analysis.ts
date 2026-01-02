// Analysis results and related types
export interface AnalysisResults {
  risks: Risk[]
  bottlenecks: Bottleneck[]
  missingSteps: MissingStep[]
  improvements: Improvement[]
  refinedWorkflow: WorkflowStructure
  confidence: number
}

export interface Risk {
  type: RiskType
  severity: Severity
  description: string
  affectedStages: string[]
  mitigation: string
}

export interface Bottleneck {
  id: string
  type: BottleneckType
  description: string
  affectedStages: string[]
  impact: Impact
  suggestions: string[]
}

export interface MissingStep {
  id: string
  type: MissingStepType
  description: string
  suggestedLocation: string
  priority: Priority
  implementation: string
}

export interface Improvement {
  type: ImprovementType
  priority: Priority
  description: string
  implementation: string
  tradeoffs: string[]
  goalAlignment: number
}

// Enums for analysis types
export enum RiskType {
  SINGLE_POINT_OF_FAILURE = 'single_point_of_failure',
  MISSING_RETRY = 'missing_retry',
  SCALING_ISSUE = 'scaling_issue',
  SECURITY_VULNERABILITY = 'security_vulnerability',
  DATA_LOSS = 'data_loss'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum BottleneckType {
  RESOURCE = 'resource',
  DEPENDENCY = 'dependency',
  SEQUENTIAL = 'sequential',
  NETWORK = 'network'
}

export enum Impact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum MissingStepType {
  VALIDATION = 'validation',
  ERROR_HANDLING = 'error_handling',
  MONITORING = 'monitoring',
  CLEANUP = 'cleanup',
  NOTIFICATION = 'notification'
}

export enum ImprovementType {
  ARCHITECTURE = 'architecture',
  PERFORMANCE = 'performance',
  RELIABILITY = 'reliability',
  COST = 'cost',
  MAINTAINABILITY = 'maintainability'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Import WorkflowStructure from workflow types
import { WorkflowStructure } from './workflow'
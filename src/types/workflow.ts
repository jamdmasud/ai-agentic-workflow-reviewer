// Core workflow structure types
export interface WorkflowStructure {
  stages: Stage[]
  dependencies: Dependency[]
  triggers: Trigger[]
  resources: Resource[]
  metadata: WorkflowMetadata
}

export interface Stage {
  id: string
  name: string
  type: StageType
  configuration: Record<string, any>
  dependencies: string[]
  retryPolicy?: RetryPolicy
}

export interface Dependency {
  from: string
  to: string
  type: DependencyType
  condition?: string
}

export interface Trigger {
  id: string
  type: TriggerType
  condition: string
  targetStages: string[]
}

export interface Resource {
  id: string
  type: ResourceType
  configuration: Record<string, any>
  allocation?: ResourceAllocation
}

export interface WorkflowMetadata {
  name: string
  version: string
  description?: string
  author?: string
  created: Date
  modified: Date
  tags?: string[]
}

export interface RetryPolicy {
  maxAttempts: number
  backoffStrategy: BackoffStrategy
  retryConditions: string[]
}

// Enums for type safety
export enum StageType {
  TASK = 'task',
  CONDITION = 'condition',
  PARALLEL = 'parallel',
  SEQUENTIAL = 'sequential',
  LOOP = 'loop'
}

export enum DependencyType {
  SEQUENTIAL = 'sequential',
  CONDITIONAL = 'conditional',
  RESOURCE = 'resource',
  DATA = 'data'
}

export enum TriggerType {
  SCHEDULE = 'schedule',
  EVENT = 'event',
  WEBHOOK = 'webhook',
  MANUAL = 'manual'
}

export enum ResourceType {
  COMPUTE = 'compute',
  STORAGE = 'storage',
  NETWORK = 'network',
  DATABASE = 'database'
}

export enum BackoffStrategy {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  FIXED = 'fixed'
}

export interface ResourceAllocation {
  cpu?: number
  memory?: number
  storage?: number
  bandwidth?: number
}
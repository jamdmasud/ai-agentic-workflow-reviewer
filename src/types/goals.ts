// Goal-related types and configurations
export enum Goal {
  RELIABILITY = 'reliability',
  COST = 'cost',
  SIMPLICITY = 'simplicity'
}

export interface GoalContext {
  primary: Goal
  parameters: GoalParameters
}

export interface GoalParameters {
  reliability: ReliabilityParameters
  cost: CostParameters
  simplicity: SimplicityParameters
}

export interface ReliabilityParameters {
  redundancyWeight: number
  faultToleranceWeight: number
  monitoringWeight: number
}

export interface CostParameters {
  resourceEfficiencyWeight: number
  serviceConsolidationWeight: number
  scalingCostWeight: number
}

export interface SimplicityParameters {
  architecturalComplexityWeight: number
  dependencyCountWeight: number
  maintainabilityWeight: number
}

// Default goal parameters
export const DEFAULT_GOAL_PARAMETERS: GoalParameters = {
  reliability: {
    redundancyWeight: 0.8,
    faultToleranceWeight: 0.9,
    monitoringWeight: 0.7
  },
  cost: {
    resourceEfficiencyWeight: 0.9,
    serviceConsolidationWeight: 0.8,
    scalingCostWeight: 0.7
  },
  simplicity: {
    architecturalComplexityWeight: 0.8,
    dependencyCountWeight: 0.9,
    maintainabilityWeight: 0.8
  }
}

// Goal display information
export interface GoalOption {
  value: Goal
  label: string
  description: string
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: Goal.RELIABILITY,
    label: 'Reliability',
    description: 'Prioritize fault tolerance, redundancy, and error handling'
  },
  {
    value: Goal.COST,
    label: 'Cost',
    description: 'Prioritize resource efficiency, service consolidation, and cost reduction'
  },
  {
    value: Goal.SIMPLICITY,
    label: 'Simplicity',
    description: 'Prioritize architectural simplification, reduced dependencies, and maintainability'
  }
]
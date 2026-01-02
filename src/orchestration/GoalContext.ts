import { 
  Goal, 
  GoalContext as GoalContextType, 
  GoalParameters, 
  DEFAULT_GOAL_PARAMETERS,
  ReliabilityParameters,
  CostParameters,
  SimplicityParameters
} from '../types/goals';

export class GoalContext {
  private currentGoal: Goal;
  private parameters: GoalParameters;

  constructor(goal: Goal = Goal.RELIABILITY, customParameters?: Partial<GoalParameters>) {
    this.currentGoal = goal;
    this.parameters = this.mergeParameters(DEFAULT_GOAL_PARAMETERS, customParameters);
  }

  /**
   * Get the current goal context
   */
  getContext(): GoalContextType {
    return {
      primary: this.currentGoal,
      parameters: this.parameters
    };
  }

  /**
   * Update the current goal and recalculate parameters
   */
  setGoal(goal: Goal, customParameters?: Partial<GoalParameters>): void {
    this.currentGoal = goal;
    if (customParameters) {
      this.parameters = this.mergeParameters(DEFAULT_GOAL_PARAMETERS, customParameters);
    }
  }

  /**
   * Get goal-specific weights for analysis prioritization
   */
  getGoalWeights(): Record<string, number> {
    switch (this.currentGoal) {
      case Goal.RELIABILITY:
        return {
          redundancy: this.parameters.reliability.redundancyWeight,
          faultTolerance: this.parameters.reliability.faultToleranceWeight,
          monitoring: this.parameters.reliability.monitoringWeight,
          performance: 0.4,
          cost: 0.3,
          simplicity: 0.5
        };
      
      case Goal.COST:
        return {
          resourceEfficiency: this.parameters.cost.resourceEfficiencyWeight,
          serviceConsolidation: this.parameters.cost.serviceConsolidationWeight,
          scalingCost: this.parameters.cost.scalingCostWeight,
          reliability: 0.5,
          performance: 0.6,
          simplicity: 0.4
        };
      
      case Goal.SIMPLICITY:
        return {
          architecturalComplexity: this.parameters.simplicity.architecturalComplexityWeight,
          dependencyCount: this.parameters.simplicity.dependencyCountWeight,
          maintainability: this.parameters.simplicity.maintainabilityWeight,
          reliability: 0.6,
          performance: 0.3,
          cost: 0.5
        };
      
      default:
        return {};
    }
  }

  /**
   * Get goal-specific analysis prompts or instructions
   */
  getAnalysisInstructions(): {
    focus: string[];
    priorities: string[];
    tradeoffs: string[];
  } {
    switch (this.currentGoal) {
      case Goal.RELIABILITY:
        return {
          focus: [
            'Identify single points of failure',
            'Analyze retry and recovery mechanisms',
            'Evaluate monitoring and alerting coverage',
            'Assess fault tolerance patterns'
          ],
          priorities: [
            'System availability and uptime',
            'Error handling and recovery',
            'Redundancy and failover capabilities',
            'Monitoring and observability'
          ],
          tradeoffs: [
            'May increase system complexity',
            'Could require additional resources',
            'Might impact development velocity',
            'May increase operational overhead'
          ]
        };

      case Goal.COST:
        return {
          focus: [
            'Identify resource inefficiencies',
            'Analyze scaling cost implications',
            'Evaluate service consolidation opportunities',
            'Assess operational cost drivers'
          ],
          priorities: [
            'Resource utilization optimization',
            'Service consolidation benefits',
            'Scaling cost efficiency',
            'Operational cost reduction'
          ],
          tradeoffs: [
            'May reduce redundancy and reliability',
            'Could limit performance optimization',
            'Might increase technical debt',
            'May impact system flexibility'
          ]
        };

      case Goal.SIMPLICITY:
        return {
          focus: [
            'Identify unnecessary complexity',
            'Analyze dependency relationships',
            'Evaluate architectural clarity',
            'Assess maintainability factors'
          ],
          priorities: [
            'Code and architecture simplicity',
            'Reduced dependency complexity',
            'Improved maintainability',
            'Clear and understandable design'
          ],
          tradeoffs: [
            'May sacrifice some performance optimizations',
            'Could reduce advanced feature capabilities',
            'Might limit scalability options',
            'May not be optimal for complex requirements'
          ]
        };

      default:
        return {
          focus: [],
          priorities: [],
          tradeoffs: []
        };
    }
  }

  /**
   * Determine if a specific improvement aligns with the current goal
   */
  isImprovementAligned(improvementType: string, description: string): {
    aligned: boolean;
    score: number;
    reasoning: string;
  } {
    const weights = this.getGoalWeights();
    let score = 0.5; // Default neutral score
    let reasoning = '';

    switch (this.currentGoal) {
      case Goal.RELIABILITY:
        if (improvementType.toLowerCase().includes('reliability') ||
            description.toLowerCase().includes('redundancy') ||
            description.toLowerCase().includes('fault') ||
            description.toLowerCase().includes('retry')) {
          score = 0.9;
          reasoning = 'High alignment with reliability goal';
        } else if (improvementType.toLowerCase().includes('performance')) {
          score = 0.6;
          reasoning = 'Moderate alignment - performance can impact reliability';
        } else if (improvementType.toLowerCase().includes('cost')) {
          score = 0.3;
          reasoning = 'Low alignment - cost optimization may conflict with reliability';
        }
        break;

      case Goal.COST:
        if (improvementType.toLowerCase().includes('cost') ||
            description.toLowerCase().includes('efficiency') ||
            description.toLowerCase().includes('consolidation') ||
            description.toLowerCase().includes('resource')) {
          score = 0.9;
          reasoning = 'High alignment with cost optimization goal';
        } else if (improvementType.toLowerCase().includes('performance')) {
          score = 0.7;
          reasoning = 'Good alignment - performance improvements can reduce costs';
        } else if (improvementType.toLowerCase().includes('reliability')) {
          score = 0.4;
          reasoning = 'Moderate alignment - reliability measures may increase costs';
        }
        break;

      case Goal.SIMPLICITY:
        if (improvementType.toLowerCase().includes('maintainability') ||
            description.toLowerCase().includes('simplify') ||
            description.toLowerCase().includes('reduce complexity') ||
            description.toLowerCase().includes('consolidate')) {
          score = 0.9;
          reasoning = 'High alignment with simplicity goal';
        } else if (description.toLowerCase().includes('complex') ||
            description.toLowerCase().includes('sophisticated') ||
            description.toLowerCase().includes('advanced')) {
          score = 0.2;
          reasoning = 'Low alignment - adds complexity contrary to simplicity goal';
        }
        break;
    }

    return {
      aligned: score >= 0.6,
      score,
      reasoning
    };
  }

  /**
   * Get goal-specific risk tolerance levels
   */
  getRiskTolerance(): {
    performance: 'low' | 'medium' | 'high';
    reliability: 'low' | 'medium' | 'high';
    cost: 'low' | 'medium' | 'high';
    complexity: 'low' | 'medium' | 'high';
  } {
    switch (this.currentGoal) {
      case Goal.RELIABILITY:
        return {
          performance: 'medium',
          reliability: 'low',      // Low tolerance for reliability risks
          cost: 'high',           // High tolerance for cost increases
          complexity: 'medium'    // Medium tolerance for complexity
        };

      case Goal.COST:
        return {
          performance: 'medium',
          reliability: 'medium',  // Medium tolerance for reliability risks
          cost: 'low',           // Low tolerance for cost increases
          complexity: 'medium'   // Medium tolerance for complexity
        };

      case Goal.SIMPLICITY:
        return {
          performance: 'high',    // High tolerance for performance trade-offs
          reliability: 'medium',  // Medium tolerance for reliability risks
          cost: 'medium',        // Medium tolerance for cost increases
          complexity: 'low'      // Low tolerance for complexity
        };

      default:
        return {
          performance: 'medium',
          reliability: 'medium',
          cost: 'medium',
          complexity: 'medium'
        };
    }
  }

  /**
   * Merge default parameters with custom parameters
   */
  private mergeParameters(
    defaultParams: GoalParameters, 
    customParams?: Partial<GoalParameters>
  ): GoalParameters {
    if (!customParams) {
      return { ...defaultParams };
    }

    return {
      reliability: { ...defaultParams.reliability, ...customParams.reliability },
      cost: { ...defaultParams.cost, ...customParams.cost },
      simplicity: { ...defaultParams.simplicity, ...customParams.simplicity }
    };
  }

  /**
   * Create a goal context for a specific analysis phase
   */
  createPhaseContext(phase: 'parsing' | 'risk_analysis' | 'optimization' | 'criticism'): GoalContextType & {
    phase: string;
    instructions: ReturnType<typeof this.getAnalysisInstructions>;
    weights: Record<string, number>;
  } {
    return {
      ...this.getContext(),
      phase,
      instructions: this.getAnalysisInstructions(),
      weights: this.getGoalWeights()
    };
  }

  /**
   * Validate goal transition (useful for UI feedback)
   */
  validateGoalTransition(newGoal: Goal): {
    valid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (this.currentGoal === newGoal) {
      return {
        valid: true,
        warnings: ['Goal is already set to ' + newGoal],
        recommendations: []
      };
    }

    // Analyze potential conflicts in goal transition
    if (this.currentGoal === Goal.RELIABILITY && newGoal === Goal.COST) {
      warnings.push('Switching from reliability to cost focus may reduce system resilience');
      recommendations.push('Review critical reliability measures before optimizing for cost');
    }

    if (this.currentGoal === Goal.COST && newGoal === Goal.RELIABILITY) {
      warnings.push('Switching from cost to reliability focus may increase resource requirements');
      recommendations.push('Budget for additional infrastructure and operational costs');
    }

    if (newGoal === Goal.SIMPLICITY) {
      recommendations.push('Consider the trade-offs between simplicity and advanced features');
      recommendations.push('Ensure simplified design still meets core requirements');
    }

    return {
      valid: true,
      warnings,
      recommendations
    };
  }
}
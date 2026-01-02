import { 
  WorkflowStructure, 
  Stage, 
  Dependency, 
  Trigger,
  Resource,
  DependencyType,
  StageType,
  TriggerType
} from '../types/workflow';
import { 
  Risk, 
  RiskType,
  Bottleneck, 
  BottleneckType,
  Improvement, 
  ImprovementType, 
  Priority,
  MissingStep,
  Severity,
  Impact
} from '../types/analysis';
import { Goal } from '../types/goals';
import { RiskAnalysis } from './RiskAnalyzerAgent';
import { OptimizationSuggestions } from './OptimizationAgent';

export interface CriticismReport {
  counterArguments: CounterArgument[];
  challengedAssumptions: ChallengedAssumption[];
  overengineeringDetections: OverengineeringDetection[];
  alternativePerspectives: AlternativePerspective[];
  confidence: number;
}

export interface CounterArgument {
  id: string;
  targetType: 'risk' | 'improvement' | 'missing_step' | 'bottleneck';
  targetId: string;
  argument: string;
  reasoning: string;
  severity: 'low' | 'medium' | 'high';
  tradeoffs: string[];
}

export interface ChallengedAssumption {
  id: string;
  assumption: string;
  challenge: string;
  alternativeApproach: string;
  riskOfChallenge: string;
  benefitOfChallenge: string;
}

export interface OverengineeringDetection {
  id: string;
  type: 'unnecessary_complexity' | 'premature_optimization' | 'over_abstraction' | 'excessive_redundancy';
  description: string;
  affectedComponents: string[];
  simplificationSuggestion: string;
  potentialDownsides: string[];
}

export interface AlternativePerspective {
  id: string;
  originalRecommendation: string;
  alternativeApproach: string;
  pros: string[];
  cons: string[];
  contextWhereBetter: string;
}

export class CriticAgent {
  /**
   * Main criticism method that challenges assumptions and identifies overengineering
   */
  async critique(
    structure: WorkflowStructure,
    riskAnalysis: RiskAnalysis,
    optimizationSuggestions: OptimizationSuggestions,
    goal: Goal
  ): Promise<CriticismReport> {
    const counterArguments: CounterArgument[] = [];
    const challengedAssumptions: ChallengedAssumption[] = [];
    const overengineeringDetections: OverengineeringDetection[] = [];
    const alternativePerspectives: AlternativePerspective[] = [];

    // Generate counter-arguments for risks, improvements, and missing steps
    const riskCounterArgs = this.generateRiskCounterArguments(riskAnalysis.risks, goal);
    counterArguments.push(...riskCounterArgs);

    const improvementCounterArgs = this.generateImprovementCounterArguments(optimizationSuggestions.improvements, goal);
    counterArguments.push(...improvementCounterArgs);

    const missingStepCounterArgs = this.generateMissingStepCounterArguments(optimizationSuggestions.missingSteps, goal);
    counterArguments.push(...missingStepCounterArgs);

    const bottleneckCounterArgs = this.generateBottleneckCounterArguments(riskAnalysis.bottlenecks, goal);
    counterArguments.push(...bottleneckCounterArgs);

    // Challenge assumptions about the workflow design
    const workflowAssumptions = this.challengeWorkflowAssumptions(structure, goal);
    challengedAssumptions.push(...workflowAssumptions);

    const analysisAssumptions = this.challengeAnalysisAssumptions(riskAnalysis, optimizationSuggestions, goal);
    challengedAssumptions.push(...analysisAssumptions);

    // Detect overengineering patterns
    const complexityDetections = this.detectUnnecessaryComplexity(structure, optimizationSuggestions, goal);
    overengineeringDetections.push(...complexityDetections);

    const prematureOptimizations = this.detectPrematureOptimization(optimizationSuggestions, goal);
    overengineeringDetections.push(...prematureOptimizations);

    const excessiveRedundancy = this.detectExcessiveRedundancy(structure, optimizationSuggestions, goal);
    overengineeringDetections.push(...excessiveRedundancy);

    // Generate alternative perspectives
    const improvementAlternatives = this.generateImprovementAlternatives(optimizationSuggestions.improvements, goal);
    alternativePerspectives.push(...improvementAlternatives);

    const architecturalAlternatives = this.generateArchitecturalAlternatives(structure, goal);
    alternativePerspectives.push(...architecturalAlternatives);

    return {
      counterArguments,
      challengedAssumptions,
      overengineeringDetections,
      alternativePerspectives,
      confidence: this.calculateConfidence(structure, riskAnalysis, optimizationSuggestions)
    };
  }

  /**
   * Generate counter-arguments for identified risks
   */
  private generateRiskCounterArguments(risks: Risk[], goal: Goal): CounterArgument[] {
    const counterArgs: CounterArgument[] = [];

    for (const risk of risks) {
      switch (risk.type) {
        case RiskType.SINGLE_POINT_OF_FAILURE:
          if (this.shouldChallengeSpofRisk(risk, goal)) {
            counterArgs.push({
              id: `counter-risk-${risk.type}-${Date.now()}`,
              targetType: 'risk',
              targetId: risk.affectedStages[0],
              argument: 'This "single point of failure" may be acceptable given the workflow context',
              reasoning: this.generateSpofCounterReasoning(risk, goal),
              severity: this.calculateCounterArgumentSeverity(risk.severity, goal),
              tradeoffs: [
                'Accepting this risk reduces complexity and development time',
                'May be appropriate for non-critical workflows',
                'Cost of mitigation may exceed benefit'
              ]
            });
          }
          break;

        case RiskType.MISSING_RETRY:
          if (this.shouldChallengeRetryRisk(risk, goal)) {
            counterArgs.push({
              id: `counter-risk-${risk.type}-${Date.now()}`,
              targetType: 'risk',
              targetId: risk.affectedStages[0],
              argument: 'Adding retry logic may introduce unnecessary complexity',
              reasoning: this.generateRetryCounterReasoning(risk, goal),
              severity: this.calculateCounterArgumentSeverity(risk.severity, goal),
              tradeoffs: [
                'Retry logic adds complexity and potential for unexpected behavior',
                'May mask underlying issues that should be fixed',
                'Could increase resource usage and costs'
              ]
            });
          }
          break;

        case RiskType.SCALING_ISSUE:
          if (goal === Goal.SIMPLICITY) {
            counterArgs.push({
              id: `counter-risk-${risk.type}-${Date.now()}`,
              targetType: 'risk',
              targetId: risk.affectedStages[0],
              argument: 'Premature scaling optimization may be unnecessary',
              reasoning: 'Current scale may be sufficient for actual usage patterns',
              severity: 'medium',
              tradeoffs: [
                'Scaling solutions add architectural complexity',
                'May be over-engineering for current needs',
                'Simpler solutions are easier to maintain'
              ]
            });
          }
          break;
      }
    }

    return counterArgs;
  }

  /**
   * Generate counter-arguments for optimization improvements
   */
  private generateImprovementCounterArguments(improvements: Improvement[], goal: Goal): CounterArgument[] {
    const counterArgs: CounterArgument[] = [];

    for (const improvement of improvements) {
      switch (improvement.type) {
        case ImprovementType.RELIABILITY:
          if (goal === Goal.SIMPLICITY || goal === Goal.COST) {
            counterArgs.push({
              id: `counter-improvement-${improvement.type}-${Date.now()}`,
              targetType: 'improvement',
              targetId: improvement.description.substring(0, 20),
              argument: 'This reliability improvement may be over-engineering',
              reasoning: this.generateReliabilityCounterReasoning(improvement, goal),
              severity: this.mapPriorityToSeverity(improvement.priority),
              tradeoffs: [
                'Increased complexity for marginal reliability gains',
                'Higher development and maintenance costs',
                'May delay time to market'
              ]
            });
          }
          break;

        case ImprovementType.ARCHITECTURE:
          if (improvement.description.toLowerCase().includes('complex') || 
              improvement.description.toLowerCase().includes('sophisticated')) {
            counterArgs.push({
              id: `counter-improvement-${improvement.type}-${Date.now()}`,
              targetType: 'improvement',
              targetId: improvement.description.substring(0, 20),
              argument: 'Architectural changes may introduce unnecessary complexity',
              reasoning: 'Current architecture may be adequate for requirements',
              severity: this.mapPriorityToSeverity(improvement.priority),
              tradeoffs: [
                'Architectural changes require significant refactoring',
                'May introduce new failure modes',
                'Team may lack expertise in new architecture'
              ]
            });
          }
          break;

        case ImprovementType.PERFORMANCE:
          if (goal === Goal.SIMPLICITY) {
            counterArgs.push({
              id: `counter-improvement-${improvement.type}-${Date.now()}`,
              targetType: 'improvement',
              targetId: improvement.description.substring(0, 20),
              argument: 'Performance optimization may be premature',
              reasoning: 'Current performance may be sufficient for actual usage',
              severity: 'low',
              tradeoffs: [
                'Performance optimizations often increase code complexity',
                'May make debugging more difficult',
                'Could introduce subtle bugs'
              ]
            });
          }
          break;
      }
    }

    return counterArgs;
  }

  /**
   * Generate counter-arguments for missing steps
   */
  private generateMissingStepCounterArguments(missingSteps: MissingStep[], goal: Goal): CounterArgument[] {
    const counterArgs: CounterArgument[] = [];

    for (const step of missingSteps) {
      if (goal === Goal.SIMPLICITY && step.priority === Priority.LOW) {
        counterArgs.push({
          id: `counter-missing-${step.type}-${Date.now()}`,
          targetType: 'missing_step',
          targetId: step.id,
          argument: 'This additional step may not be necessary',
          reasoning: 'Adding more steps increases workflow complexity without clear benefit',
          severity: 'low',
          tradeoffs: [
            'Additional steps increase maintenance burden',
            'More points of failure in the workflow',
            'Longer development time'
          ]
        });
      }

      if (step.type.toString().includes('MONITORING') && goal === Goal.COST) {
        counterArgs.push({
          id: `counter-missing-${step.type}-${Date.now()}`,
          targetType: 'missing_step',
          targetId: step.id,
          argument: 'Extensive monitoring may not justify the cost',
          reasoning: 'Monitoring infrastructure adds operational overhead and costs',
          severity: 'medium',
          tradeoffs: [
            'Monitoring systems require maintenance and resources',
            'May generate alert fatigue',
            'Cost may exceed value for simple workflows'
          ]
        });
      }
    }

    return counterArgs;
  }

  /**
   * Generate counter-arguments for bottlenecks
   */
  private generateBottleneckCounterArguments(bottlenecks: Bottleneck[], goal: Goal): CounterArgument[] {
    const counterArgs: CounterArgument[] = [];

    for (const bottleneck of bottlenecks) {
      if (bottleneck.type === BottleneckType.SEQUENTIAL && goal === Goal.SIMPLICITY) {
        counterArgs.push({
          id: `counter-bottleneck-${bottleneck.id}`,
          targetType: 'bottleneck',
          targetId: bottleneck.id,
          argument: 'Sequential execution may be preferable for simplicity',
          reasoning: 'Sequential workflows are easier to understand, debug, and maintain',
          severity: 'low',
          tradeoffs: [
            'Parallel execution adds complexity and coordination overhead',
            'Sequential execution is more predictable',
            'Easier to trace and debug issues'
          ]
        });
      }

      if (bottleneck.impact === Impact.LOW) {
        counterArgs.push({
          id: `counter-bottleneck-${bottleneck.id}`,
          targetType: 'bottleneck',
          targetId: bottleneck.id,
          argument: 'Low-impact bottlenecks may not warrant optimization',
          reasoning: 'Cost of optimization may exceed the benefit for low-impact bottlenecks',
          severity: 'low',
          tradeoffs: [
            'Optimization effort could be better spent elsewhere',
            'May introduce complexity without significant benefit',
            'Current performance may be acceptable'
          ]
        });
      }
    }

    return counterArgs;
  }

  /**
   * Challenge assumptions about workflow design
   */
  private challengeWorkflowAssumptions(structure: WorkflowStructure, goal: Goal): ChallengedAssumption[] {
    const assumptions: ChallengedAssumption[] = [];

    // Challenge assumption about needing all stages
    if (structure.stages.length > 5) {
      assumptions.push({
        id: `assumption-stages-${Date.now()}`,
        assumption: 'All defined stages are necessary for the workflow',
        challenge: 'Some stages might be redundant or could be combined',
        alternativeApproach: 'Consolidate similar stages or eliminate non-essential ones',
        riskOfChallenge: 'May lose some functionality or granular control',
        benefitOfChallenge: 'Simpler workflow with fewer failure points and easier maintenance'
      });
    }

    // Challenge assumption about dependency complexity
    if (structure.dependencies.length > structure.stages.length) {
      assumptions.push({
        id: `assumption-dependencies-${Date.now()}`,
        assumption: 'Complex dependencies are necessary for workflow coordination',
        challenge: 'Many dependencies may indicate over-complicated design',
        alternativeApproach: 'Simplify workflow with fewer, clearer dependencies',
        riskOfChallenge: 'May need to restructure workflow logic',
        benefitOfChallenge: 'Easier to understand and maintain workflow'
      });
    }

    // Challenge assumption about resource requirements
    if (structure.resources.length > 3) {
      assumptions.push({
        id: `assumption-resources-${Date.now()}`,
        assumption: 'Multiple specialized resources are required',
        challenge: 'Resource diversity may be unnecessary complexity',
        alternativeApproach: 'Consolidate onto fewer, more general-purpose resources',
        riskOfChallenge: 'May lose some optimization or specialization',
        benefitOfChallenge: 'Reduced operational complexity and cost'
      });
    }

    // Challenge assumption about trigger complexity
    if (structure.triggers.length > 2) {
      assumptions.push({
        id: `assumption-triggers-${Date.now()}`,
        assumption: 'Multiple triggers provide necessary flexibility',
        challenge: 'Too many triggers may create unpredictable behavior',
        alternativeApproach: 'Simplify to one or two primary triggers',
        riskOfChallenge: 'May reduce workflow flexibility',
        benefitOfChallenge: 'More predictable and easier to debug workflow execution'
      });
    }

    return assumptions;
  }

  /**
   * Challenge assumptions about the analysis results
   */
  private challengeAnalysisAssumptions(
    riskAnalysis: RiskAnalysis, 
    optimizationSuggestions: OptimizationSuggestions, 
    goal: Goal
  ): ChallengedAssumption[] {
    const assumptions: ChallengedAssumption[] = [];

    // Challenge assumption about risk severity
    const highSeverityRisks = riskAnalysis.risks.filter(r => r.severity === Severity.HIGH || r.severity === Severity.CRITICAL);
    if (highSeverityRisks.length > 2) {
      assumptions.push({
        id: `assumption-risk-severity-${Date.now()}`,
        assumption: 'All identified high-severity risks require immediate attention',
        challenge: 'Risk severity may be overestimated for this specific context',
        alternativeApproach: 'Prioritize risks based on actual business impact and likelihood',
        riskOfChallenge: 'May leave some genuine risks unaddressed',
        benefitOfChallenge: 'Focus resources on truly critical issues'
      });
    }

    // Challenge assumption about improvement necessity
    const highPriorityImprovements = optimizationSuggestions.improvements.filter(i => i.priority === Priority.HIGH);
    if (highPriorityImprovements.length > 3) {
      assumptions.push({
        id: `assumption-improvement-priority-${Date.now()}`,
        assumption: 'All high-priority improvements should be implemented',
        challenge: 'Not all improvements may be necessary for current requirements',
        alternativeApproach: 'Implement improvements incrementally based on actual need',
        riskOfChallenge: 'May miss opportunities for optimization',
        benefitOfChallenge: 'Avoid over-engineering and focus on essential improvements'
      });
    }

    // Challenge assumption about missing steps
    if (optimizationSuggestions.missingSteps.length > 4) {
      assumptions.push({
        id: `assumption-missing-steps-${Date.now()}`,
        assumption: 'All identified missing steps should be added',
        challenge: 'Adding too many steps may over-complicate the workflow',
        alternativeApproach: 'Add only the most critical missing steps initially',
        riskOfChallenge: 'May leave some gaps in the workflow',
        benefitOfChallenge: 'Maintain workflow simplicity while addressing key gaps'
      });
    }

    return assumptions;
  }

  /**
   * Detect unnecessary complexity in the workflow
   */
  private detectUnnecessaryComplexity(
    structure: WorkflowStructure, 
    optimizationSuggestions: OptimizationSuggestions, 
    goal: Goal
  ): OverengineeringDetection[] {
    const detections: OverengineeringDetection[] = [];

    // Detect over-abstraction
    const abstractionDetection = this.detectOverAbstraction(structure);
    if (abstractionDetection) {
      detections.push(abstractionDetection);
    }

    // Detect unnecessary complexity in improvements
    const complexImprovements = optimizationSuggestions.improvements.filter(imp => 
      imp.description.toLowerCase().includes('complex') ||
      imp.description.toLowerCase().includes('sophisticated') ||
      imp.description.toLowerCase().includes('advanced')
    );

    for (const improvement of complexImprovements) {
      detections.push({
        id: `overeng-complexity-${Date.now()}`,
        type: 'unnecessary_complexity',
        description: `Suggested improvement may introduce unnecessary complexity: ${improvement.description}`,
        affectedComponents: [improvement.description.substring(0, 30)],
        simplificationSuggestion: 'Consider simpler alternatives that achieve similar goals',
        potentialDownsides: [
          'May lose some advanced features',
          'Could be less optimal in edge cases'
        ]
      });
    }

    // Detect excessive stage granularity
    if (structure.stages.length > 8 && structure.stages.every(s => s.dependencies.length <= 1)) {
      detections.push({
        id: `overeng-granularity-${Date.now()}`,
        type: 'over_abstraction',
        description: 'Workflow may be over-abstracted with too many small stages',
        affectedComponents: structure.stages.map(s => s.id),
        simplificationSuggestion: 'Combine related stages into larger, more cohesive units',
        potentialDownsides: [
          'May lose fine-grained control',
          'Could make some operations less reusable'
        ]
      });
    }

    return detections;
  }

  /**
   * Detect premature optimization patterns
   */
  private detectPrematureOptimization(optimizationSuggestions: OptimizationSuggestions, goal: Goal): OverengineeringDetection[] {
    const detections: OverengineeringDetection[] = [];

    // Detect performance optimizations when goal is not performance-related
    if (goal === Goal.SIMPLICITY) {
      const performanceImprovements = optimizationSuggestions.improvements.filter(
        imp => imp.type === ImprovementType.PERFORMANCE
      );

      for (const improvement of performanceImprovements) {
        detections.push({
          id: `overeng-premature-${Date.now()}`,
          type: 'premature_optimization',
          description: `Performance optimization may be premature: ${improvement.description}`,
          affectedComponents: [improvement.description.substring(0, 30)],
          simplificationSuggestion: 'Focus on correctness and simplicity first, optimize later if needed',
          potentialDownsides: [
            'May sacrifice code clarity',
            'Could introduce bugs',
            'Optimization may not be needed'
          ]
        });
      }
    }

    // Detect complex caching or optimization strategies
    const complexOptimizations = optimizationSuggestions.improvements.filter(imp =>
      imp.description.toLowerCase().includes('cach') ||
      imp.description.toLowerCase().includes('optim') ||
      imp.description.toLowerCase().includes('pool')
    );

    for (const optimization of complexOptimizations) {
      if (optimization.priority === Priority.HIGH && goal !== Goal.COST) {
        detections.push({
          id: `overeng-complex-opt-${Date.now()}`,
          type: 'premature_optimization',
          description: `Complex optimization may be unnecessary: ${optimization.description}`,
          affectedComponents: [optimization.description.substring(0, 30)],
          simplificationSuggestion: 'Start with simple implementation and optimize based on actual performance data',
          potentialDownsides: [
            'May add complexity without proven benefit',
            'Could be harder to debug and maintain'
          ]
        });
      }
    }

    return detections;
  }

  /**
   * Detect excessive redundancy
   */
  private detectExcessiveRedundancy(
    structure: WorkflowStructure, 
    optimizationSuggestions: OptimizationSuggestions, 
    goal: Goal
  ): OverengineeringDetection[] {
    const detections: OverengineeringDetection[] = [];

    // Detect excessive reliability improvements when goal is not reliability
    if (goal !== Goal.RELIABILITY) {
      const reliabilityImprovements = optimizationSuggestions.improvements.filter(
        imp => imp.type === ImprovementType.RELIABILITY
      );

      if (reliabilityImprovements.length > 2) {
        detections.push({
          id: `overeng-redundancy-${Date.now()}`,
          type: 'excessive_redundancy',
          description: 'Multiple reliability improvements may create excessive redundancy',
          affectedComponents: reliabilityImprovements.map(imp => imp.description.substring(0, 20)),
          simplificationSuggestion: 'Implement only the most critical reliability measures',
          potentialDownsides: [
            'May increase complexity significantly',
            'Higher operational costs',
            'More components to maintain'
          ]
        });
      }
    }

    // Detect redundant stages
    const similarStages = this.findSimilarStages(structure.stages);
    if (similarStages.length > 0) {
      detections.push({
        id: `overeng-redundant-stages-${Date.now()}`,
        type: 'excessive_redundancy',
        description: 'Multiple similar stages may be redundant',
        affectedComponents: similarStages,
        simplificationSuggestion: 'Consolidate similar stages or eliminate redundant ones',
        potentialDownsides: [
          'May lose some specialized functionality',
          'Could reduce parallel processing opportunities'
        ]
      });
    }

    return detections;
  }

  /**
   * Generate alternative perspectives for improvements
   */
  private generateImprovementAlternatives(improvements: Improvement[], goal: Goal): AlternativePerspective[] {
    const alternatives: AlternativePerspective[] = [];

    for (const improvement of improvements) {
      switch (improvement.type) {
        case ImprovementType.RELIABILITY:
          alternatives.push({
            id: `alt-reliability-${Date.now()}`,
            originalRecommendation: improvement.description,
            alternativeApproach: 'Accept higher risk in exchange for simplicity and faster development',
            pros: [
              'Faster time to market',
              'Lower development complexity',
              'Reduced operational overhead'
            ],
            cons: [
              'Higher risk of failures',
              'May require manual intervention',
              'Could impact user experience'
            ],
            contextWhereBetter: 'Non-critical workflows, prototype environments, or cost-sensitive projects'
          });
          break;

        case ImprovementType.PERFORMANCE:
          alternatives.push({
            id: `alt-performance-${Date.now()}`,
            originalRecommendation: improvement.description,
            alternativeApproach: 'Optimize only when performance becomes a proven bottleneck',
            pros: [
              'Simpler initial implementation',
              'Focus on correctness first',
              'Avoid premature optimization'
            ],
            cons: [
              'May need refactoring later',
              'Could impact user experience if scale grows',
              'May be harder to optimize later'
            ],
            contextWhereBetter: 'Early-stage projects, uncertain scale requirements, or simple use cases'
          });
          break;

        case ImprovementType.ARCHITECTURE:
          alternatives.push({
            id: `alt-architecture-${Date.now()}`,
            originalRecommendation: improvement.description,
            alternativeApproach: 'Keep current architecture and evolve incrementally',
            pros: [
              'No disruption to existing system',
              'Team familiar with current approach',
              'Lower risk of introducing new issues'
            ],
            cons: [
              'May accumulate technical debt',
              'Could limit future scalability',
              'May be less optimal long-term'
            ],
            contextWhereBetter: 'Stable systems, risk-averse environments, or resource-constrained teams'
          });
          break;
      }
    }

    return alternatives;
  }

  /**
   * Generate architectural alternatives
   */
  private generateArchitecturalAlternatives(structure: WorkflowStructure, goal: Goal): AlternativePerspective[] {
    const alternatives: AlternativePerspective[] = [];

    // Alternative to complex workflows
    if (structure.stages.length > 6) {
      alternatives.push({
        id: `alt-arch-simple-${Date.now()}`,
        originalRecommendation: 'Maintain current multi-stage workflow architecture',
        alternativeApproach: 'Consolidate into fewer, more comprehensive stages',
        pros: [
          'Simpler to understand and maintain',
          'Fewer failure points',
          'Easier debugging and monitoring'
        ],
        cons: [
          'Less granular control',
          'May be harder to parallelize',
          'Could be less reusable'
        ],
        contextWhereBetter: 'Simple use cases, small teams, or when maintainability is prioritized'
      });
    }

    // Alternative to complex dependencies
    if (structure.dependencies.length > structure.stages.length * 0.8) {
      alternatives.push({
        id: `alt-arch-deps-${Date.now()}`,
        originalRecommendation: 'Maintain complex dependency relationships',
        alternativeApproach: 'Simplify to linear or simple parallel execution',
        pros: [
          'Easier to understand execution flow',
          'Simpler debugging',
          'More predictable behavior'
        ],
        cons: [
          'May be less efficient',
          'Could lose some optimization opportunities',
          'Less flexible execution patterns'
        ],
        contextWhereBetter: 'Predictable workloads, debugging-intensive environments, or simple requirements'
      });
    }

    return alternatives;
  }

  /**
   * Helper methods
   */
  private shouldChallengeSpofRisk(risk: Risk, goal: Goal): boolean {
    return goal === Goal.SIMPLICITY || 
           (goal === Goal.COST && risk.severity !== Severity.CRITICAL) ||
           risk.affectedStages.length <= 2;
  }

  private shouldChallengeRetryRisk(risk: Risk, goal: Goal): boolean {
    return goal === Goal.SIMPLICITY || 
           (risk.severity === Severity.LOW || risk.severity === Severity.MEDIUM);
  }

  private generateSpofCounterReasoning(risk: Risk, goal: Goal): string {
    if (goal === Goal.SIMPLICITY) {
      return 'For simple workflows, the complexity cost of eliminating SPOFs may exceed the benefit';
    }
    if (goal === Goal.COST) {
      return 'The cost of implementing redundancy may not be justified by the risk level';
    }
    return 'The impact scope is limited and may not warrant complex mitigation strategies';
  }

  private generateRetryCounterReasoning(risk: Risk, goal: Goal): string {
    if (goal === Goal.SIMPLICITY) {
      return 'Retry logic adds complexity and may mask underlying issues that should be addressed directly';
    }
    return 'The failure scenarios may be rare enough that retry logic is not cost-effective';
  }

  private generateReliabilityCounterReasoning(improvement: Improvement, goal: Goal): string {
    if (goal === Goal.SIMPLICITY) {
      return 'Reliability improvements often add complexity that may not be justified for simple use cases';
    }
    if (goal === Goal.COST) {
      return 'The cost of implementing reliability measures may exceed the value they provide';
    }
    return 'Current reliability levels may be adequate for the intended use case';
  }

  private calculateCounterArgumentSeverity(originalSeverity: Severity, goal: Goal): 'low' | 'medium' | 'high' {
    if (goal === Goal.SIMPLICITY) {
      return originalSeverity === Severity.CRITICAL ? 'medium' : 'low';
    }
    if (originalSeverity === Severity.CRITICAL) {
      return 'high';
    }
    if (originalSeverity === Severity.HIGH) {
      return 'medium';
    }
    return 'low';
  }

  private mapPriorityToSeverity(priority: Priority): 'low' | 'medium' | 'high' {
    switch (priority) {
      case Priority.CRITICAL:
      case Priority.HIGH:
        return 'high';
      case Priority.MEDIUM:
        return 'medium';
      case Priority.LOW:
        return 'low';
    }
  }

  private detectOverAbstraction(structure: WorkflowStructure): OverengineeringDetection | null {
    // Check for over-abstraction patterns
    const avgConfigSize = structure.stages.reduce((sum, stage) => 
      sum + JSON.stringify(stage.configuration).length, 0) / structure.stages.length;

    if (structure.stages.length > 6 && avgConfigSize < 100) {
      return {
        id: `overeng-abstraction-${Date.now()}`,
        type: 'over_abstraction',
        description: 'Workflow may be over-abstracted with many small, simple stages',
        affectedComponents: structure.stages.map(s => s.id),
        simplificationSuggestion: 'Consider combining related stages into more substantial units',
        potentialDownsides: [
          'May lose fine-grained control',
          'Could reduce reusability of individual components'
        ]
      };
    }

    return null;
  }

  private findSimilarStages(stages: Stage[]): string[] {
    const similar: string[] = [];
    
    for (let i = 0; i < stages.length; i++) {
      for (let j = i + 1; j < stages.length; j++) {
        if (this.areStagesSimilar(stages[i], stages[j])) {
          if (!similar.includes(stages[i].id)) similar.push(stages[i].id);
          if (!similar.includes(stages[j].id)) similar.push(stages[j].id);
        }
      }
    }
    
    return similar;
  }

  private areStagesSimilar(stage1: Stage, stage2: Stage): boolean {
    // Simple similarity check based on type and configuration similarity
    if (stage1.type !== stage2.type) return false;
    
    const config1Str = JSON.stringify(stage1.configuration);
    const config2Str = JSON.stringify(stage2.configuration);
    
    // Check for similar configuration patterns
    const similarity = this.calculateStringSimilarity(config1Str, config2Str);
    return similarity > 0.7;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateConfidence(
    structure: WorkflowStructure,
    riskAnalysis: RiskAnalysis,
    optimizationSuggestions: OptimizationSuggestions
  ): number {
    let confidence = 0.7; // Base confidence for criticism

    // Increase confidence with more complete input data
    if (structure.stages.length > 0) confidence += 0.05;
    if (riskAnalysis.risks.length > 0) confidence += 0.05;
    if (optimizationSuggestions.improvements.length > 0) confidence += 0.05;
    if (optimizationSuggestions.missingSteps.length > 0) confidence += 0.03;

    // Increase confidence if we found patterns to critique
    if (structure.stages.length > 5) confidence += 0.05; // More complex workflows easier to critique
    if (optimizationSuggestions.improvements.length > 3) confidence += 0.05; // More suggestions to challenge

    // Decrease confidence if analysis seems incomplete
    if (riskAnalysis.confidence < 0.6) confidence -= 0.1;
    if (optimizationSuggestions.confidence < 0.6) confidence -= 0.1;

    return Math.min(1.0, Math.max(0.1, confidence));
  }
}
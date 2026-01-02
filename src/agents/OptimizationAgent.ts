import { 
  WorkflowStructure, 
  Stage, 
  Dependency, 
  Trigger,
  Resource,
  DependencyType,
  StageType,
  TriggerType,
  ResourceType
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
  MissingStepType
} from '../types/analysis';
import { Goal, GoalContext, DEFAULT_GOAL_PARAMETERS } from '../types/goals';
import { RiskAnalysis } from './RiskAnalyzerAgent';

export interface OptimizationSuggestions {
  improvements: Improvement[];
  missingSteps: MissingStep[];
  refinedWorkflow: WorkflowStructure;
  confidence: number;
}

export class OptimizationAgent {
  /**
   * Main optimization method that generates goal-aware suggestions
   */
  async optimize(
    structure: WorkflowStructure, 
    riskAnalysis: RiskAnalysis, 
    goal: Goal
  ): Promise<OptimizationSuggestions> {
    const improvements: Improvement[] = [];
    const missingSteps: MissingStep[] = [];

    // Generate architecture simplification suggestions
    const architectureImprovements = this.generateArchitectureSimplifications(structure, goal);
    improvements.push(...architectureImprovements);

    // Generate trigger optimization recommendations
    const triggerImprovements = this.generateTriggerOptimizations(structure, goal);
    improvements.push(...triggerImprovements);

    // Generate goal-specific optimization suggestions
    const goalSpecificImprovements = this.generateGoalSpecificOptimizations(structure, riskAnalysis, goal);
    improvements.push(...goalSpecificImprovements);

    // Generate missing steps based on risks
    const riskBasedMissingSteps = this.generateMissingStepsFromRisks(riskAnalysis.risks, goal);
    missingSteps.push(...riskBasedMissingSteps);

    // Generate missing steps based on bottlenecks
    const bottleneckBasedMissingSteps = this.generateMissingStepsFromBottlenecks(riskAnalysis.bottlenecks, goal);
    missingSteps.push(...bottleneckBasedMissingSteps);

    // Create refined workflow incorporating suggestions
    const refinedWorkflow = this.createRefinedWorkflow(structure, improvements, missingSteps);

    return {
      improvements,
      missingSteps,
      refinedWorkflow,
      confidence: this.calculateConfidence(structure, improvements, missingSteps)
    };
  }

  /**
   * Generate architecture simplification suggestions
   */
  private generateArchitectureSimplifications(structure: WorkflowStructure, goal: Goal): Improvement[] {
    const improvements: Improvement[] = [];

    // Identify overly complex dependency patterns
    const complexDependencies = this.identifyComplexDependencies(structure);
    for (const complexity of complexDependencies) {
      improvements.push({
        type: ImprovementType.ARCHITECTURE,
        priority: goal === Goal.SIMPLICITY ? Priority.HIGH : Priority.MEDIUM,
        description: complexity.description,
        implementation: complexity.solution,
        tradeoffs: complexity.tradeoffs,
        goalAlignment: this.calculateGoalAlignment(ImprovementType.ARCHITECTURE, goal)
      });
    }

    // Suggest stage consolidation opportunities
    const consolidationOpportunities = this.identifyStageConsolidation(structure);
    for (const opportunity of consolidationOpportunities) {
      improvements.push({
        type: ImprovementType.ARCHITECTURE,
        priority: goal === Goal.SIMPLICITY ? Priority.HIGH : Priority.MEDIUM,
        description: opportunity.description,
        implementation: opportunity.solution,
        tradeoffs: opportunity.tradeoffs,
        goalAlignment: this.calculateGoalAlignment(ImprovementType.ARCHITECTURE, goal)
      });
    }

    // Identify unnecessary parallel stages
    const parallelOptimizations = this.identifyParallelOptimizations(structure);
    for (const optimization of parallelOptimizations) {
      improvements.push({
        type: ImprovementType.PERFORMANCE,
        priority: goal === Goal.COST ? Priority.HIGH : Priority.MEDIUM,
        description: optimization.description,
        implementation: optimization.solution,
        tradeoffs: optimization.tradeoffs,
        goalAlignment: this.calculateGoalAlignment(ImprovementType.PERFORMANCE, goal)
      });
    }

    return improvements;
  }

  /**
   * Generate trigger optimization recommendations
   */
  private generateTriggerOptimizations(structure: WorkflowStructure, goal: Goal): Improvement[] {
    const improvements: Improvement[] = [];

    // Analyze trigger efficiency
    for (const trigger of structure.triggers) {
      const triggerOptimizations = this.analyzeTriggerEfficiency(trigger, structure, goal);
      improvements.push(...triggerOptimizations);
    }

    // Suggest missing triggers
    const missingTriggers = this.identifyMissingTriggers(structure, goal);
    improvements.push(...missingTriggers);

    // Optimize trigger conditions
    const conditionOptimizations = this.optimizeTriggerConditions(structure.triggers, goal);
    improvements.push(...conditionOptimizations);

    return improvements;
  }

  /**
   * Generate goal-specific optimization suggestions
   */
  private generateGoalSpecificOptimizations(
    structure: WorkflowStructure, 
    riskAnalysis: RiskAnalysis, 
    goal: Goal
  ): Improvement[] {
    const improvements: Improvement[] = [];

    // Always generate content-aware improvements first
    const contentAwareImprovements = this.generateContentAwareImprovements(structure, goal);
    improvements.push(...contentAwareImprovements);

    switch (goal) {
      case Goal.RELIABILITY:
        improvements.push(...this.generateReliabilityOptimizations(structure, riskAnalysis));
        break;
      case Goal.COST:
        improvements.push(...this.generateCostOptimizations(structure, riskAnalysis));
        break;
      case Goal.SIMPLICITY:
        improvements.push(...this.generateSimplicityOptimizations(structure, riskAnalysis));
        break;
    }

    // Only use fallback if we still have no improvements
    if (improvements.length === 0) {
      improvements.push(...this.generateFallbackImprovements(goal, structure));
    }

    return improvements;
  }

  /**
   * Generate content-aware improvements based on actual workflow content
   */
  private generateContentAwareImprovements(structure: WorkflowStructure, goal: Goal): Improvement[] {
    const improvements: Improvement[] = [];

    // Analyze stage names and descriptions for specific patterns
    const stageContent = structure.stages.map(stage => ({
      id: stage.id,
      name: stage.name.toLowerCase(),
      description: (stage.configuration?.description || '').toLowerCase(),
      combined: `${stage.name} ${stage.configuration?.description || ''}`.toLowerCase()
    }));

    // Look for specific workflow patterns and suggest improvements
    const patterns = this.identifyWorkflowPatterns(stageContent);
    
    for (const pattern of patterns) {
      const patternImprovements = this.generatePatternSpecificImprovements(pattern, goal, structure);
      improvements.push(...patternImprovements);
    }

    // Generate improvements based on workflow complexity
    const complexityImprovements = this.generateComplexityBasedImprovements(structure, goal);
    improvements.push(...complexityImprovements);

    // Generate improvements based on stage relationships
    const relationshipImprovements = this.generateRelationshipBasedImprovements(structure, goal);
    improvements.push(...relationshipImprovements);

    return improvements;
  }

  /**
   * Identify patterns in workflow content
   */
  private identifyWorkflowPatterns(stageContent: Array<{id: string, name: string, description: string, combined: string}>): string[] {
    const patterns: string[] = [];

    // Check for CI/CD patterns
    const cicdKeywords = ['build', 'test', 'deploy', 'compile', 'package', 'release', 'publish'];
    if (stageContent.some(stage => cicdKeywords.some(keyword => stage.combined.includes(keyword)))) {
      patterns.push('cicd');
    }

    // Check for data processing patterns
    const dataKeywords = ['process', 'transform', 'extract', 'load', 'etl', 'data', 'parse', 'clean'];
    if (stageContent.some(stage => dataKeywords.some(keyword => stage.combined.includes(keyword)))) {
      patterns.push('data_processing');
    }

    // Check for approval/review patterns
    const approvalKeywords = ['approve', 'review', 'validate', 'check', 'verify', 'confirm'];
    if (stageContent.some(stage => approvalKeywords.some(keyword => stage.combined.includes(keyword)))) {
      patterns.push('approval');
    }

    // Check for notification patterns
    const notificationKeywords = ['notify', 'alert', 'email', 'message', 'send', 'inform'];
    if (stageContent.some(stage => notificationKeywords.some(keyword => stage.combined.includes(keyword)))) {
      patterns.push('notification');
    }

    // Check for security patterns
    const securityKeywords = ['security', 'scan', 'audit', 'compliance', 'vulnerability', 'auth'];
    if (stageContent.some(stage => securityKeywords.some(keyword => stage.combined.includes(keyword)))) {
      patterns.push('security');
    }

    return patterns;
  }

  /**
   * Generate improvements specific to identified patterns
   */
  private generatePatternSpecificImprovements(pattern: string, goal: Goal, structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];

    switch (pattern) {
      case 'cicd':
        improvements.push(...this.generateCICDImprovements(goal, structure));
        break;
      case 'data_processing':
        improvements.push(...this.generateDataProcessingImprovements(goal, structure));
        break;
      case 'approval':
        improvements.push(...this.generateApprovalWorkflowImprovements(goal, structure));
        break;
      case 'notification':
        improvements.push(...this.generateNotificationImprovements(goal, structure));
        break;
      case 'security':
        improvements.push(...this.generateSecurityImprovements(goal, structure));
        break;
    }

    return improvements;
  }

  /**
   * Generate CI/CD specific improvements
   */
  private generateCICDImprovements(goal: Goal, structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];

    switch (goal) {
      case Goal.RELIABILITY:
        improvements.push({
          type: ImprovementType.RELIABILITY,
          priority: Priority.HIGH,
          description: 'Add automated rollback mechanism for failed deployments',
          implementation: 'Implement blue-green deployment or canary releases with automatic rollback triggers',
          tradeoffs: ['Increased infrastructure complexity', 'Better deployment safety', 'Faster recovery from failures'],
          goalAlignment: 1.0
        });
        break;
      case Goal.COST:
        improvements.push({
          type: ImprovementType.COST,
          priority: Priority.HIGH,
          description: 'Optimize build resources by using shared build agents and caching',
          implementation: 'Implement build artifact caching and use spot instances for non-critical builds',
          tradeoffs: ['Potential build time variations', 'Significant cost savings on compute resources'],
          goalAlignment: 1.0
        });
        break;
      case Goal.SIMPLICITY:
        improvements.push({
          type: ImprovementType.MAINTAINABILITY,
          priority: Priority.HIGH,
          description: 'Consolidate similar build and test stages to reduce pipeline complexity',
          implementation: 'Combine related build steps and use parallel testing strategies',
          tradeoffs: ['Less granular control over individual steps', 'Simpler pipeline maintenance'],
          goalAlignment: 1.0
        });
        break;
    }

    return improvements;
  }

  /**
   * Generate data processing specific improvements
   */
  private generateDataProcessingImprovements(goal: Goal, structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];

    switch (goal) {
      case Goal.RELIABILITY:
        improvements.push({
          type: ImprovementType.RELIABILITY,
          priority: Priority.HIGH,
          description: 'Add data validation and checksum verification between processing stages',
          implementation: 'Implement data integrity checks and schema validation at each processing step',
          tradeoffs: ['Additional processing overhead', 'Better data quality assurance'],
          goalAlignment: 1.0
        });
        break;
      case Goal.COST:
        improvements.push({
          type: ImprovementType.COST,
          priority: Priority.HIGH,
          description: 'Implement data partitioning and incremental processing to reduce compute costs',
          implementation: 'Process only changed data and use efficient data formats like Parquet',
          tradeoffs: ['Increased complexity in change detection', 'Significant reduction in processing costs'],
          goalAlignment: 1.0
        });
        break;
      case Goal.SIMPLICITY:
        improvements.push({
          type: ImprovementType.MAINTAINABILITY,
          priority: Priority.MEDIUM,
          description: 'Standardize data transformation logic using reusable processing templates',
          implementation: 'Create common data processing patterns and reduce custom transformation code',
          tradeoffs: ['Less flexibility for edge cases', 'More consistent and maintainable processing logic'],
          goalAlignment: 0.9
        });
        break;
    }

    return improvements;
  }

  /**
   * Generate approval workflow specific improvements
   */
  private generateApprovalWorkflowImprovements(goal: Goal, structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];

    switch (goal) {
      case Goal.RELIABILITY:
        improvements.push({
          type: ImprovementType.RELIABILITY,
          priority: Priority.MEDIUM,
          description: 'Add timeout handling and escalation for pending approvals',
          implementation: 'Implement automatic escalation after specified time periods and backup approvers',
          tradeoffs: ['More complex approval logic', 'Prevents workflow stalls from unresponsive approvers'],
          goalAlignment: 0.9
        });
        break;
      case Goal.COST:
        improvements.push({
          type: ImprovementType.COST,
          priority: Priority.MEDIUM,
          description: 'Implement risk-based approval routing to reduce unnecessary approvals',
          implementation: 'Route low-risk changes through automated approval and high-risk through manual review',
          tradeoffs: ['Need to define risk criteria', 'Reduced approval overhead for routine changes'],
          goalAlignment: 0.8
        });
        break;
      case Goal.SIMPLICITY:
        improvements.push({
          type: ImprovementType.MAINTAINABILITY,
          priority: Priority.HIGH,
          description: 'Simplify approval criteria and reduce the number of required approvers',
          implementation: 'Streamline approval process with clear, simple criteria and fewer approval gates',
          tradeoffs: ['Potentially reduced oversight', 'Faster workflow execution and easier management'],
          goalAlignment: 1.0
        });
        break;
    }

    return improvements;
  }

  /**
   * Generate notification specific improvements
   */
  private generateNotificationImprovements(goal: Goal, structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];

    switch (goal) {
      case Goal.RELIABILITY:
        improvements.push({
          type: ImprovementType.RELIABILITY,
          priority: Priority.MEDIUM,
          description: 'Add redundant notification channels and delivery confirmation',
          implementation: 'Send notifications through multiple channels (email, Slack, SMS) with delivery tracking',
          tradeoffs: ['Increased notification complexity', 'Better assurance of critical message delivery'],
          goalAlignment: 0.8
        });
        break;
      case Goal.COST:
        improvements.push({
          type: ImprovementType.COST,
          priority: Priority.LOW,
          description: 'Optimize notification frequency and consolidate similar alerts',
          implementation: 'Batch similar notifications and use intelligent filtering to reduce notification volume',
          tradeoffs: ['Potential delay in some notifications', 'Reduced notification service costs'],
          goalAlignment: 0.6
        });
        break;
      case Goal.SIMPLICITY:
        improvements.push({
          type: ImprovementType.MAINTAINABILITY,
          priority: Priority.MEDIUM,
          description: 'Standardize notification templates and centralize notification logic',
          implementation: 'Use consistent notification formats and centralized notification service',
          tradeoffs: ['Less customization per notification', 'Easier maintenance and consistent user experience'],
          goalAlignment: 0.9
        });
        break;
    }

    return improvements;
  }

  /**
   * Generate security specific improvements
   */
  private generateSecurityImprovements(goal: Goal, structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];

    switch (goal) {
      case Goal.RELIABILITY:
        improvements.push({
          type: ImprovementType.RELIABILITY,
          priority: Priority.HIGH,
          description: 'Add security scanning failure handling and automatic remediation',
          implementation: 'Implement automatic security patch application and vulnerability remediation workflows',
          tradeoffs: ['Risk of automated changes causing issues', 'Faster response to security vulnerabilities'],
          goalAlignment: 0.9
        });
        break;
      case Goal.COST:
        improvements.push({
          type: ImprovementType.COST,
          priority: Priority.MEDIUM,
          description: 'Optimize security scanning by focusing on critical components and incremental scans',
          implementation: 'Implement risk-based scanning and scan only changed components in incremental builds',
          tradeoffs: ['Potential to miss some vulnerabilities', 'Significant reduction in scanning costs and time'],
          goalAlignment: 0.7
        });
        break;
      case Goal.SIMPLICITY:
        improvements.push({
          type: ImprovementType.MAINTAINABILITY,
          priority: Priority.MEDIUM,
          description: 'Consolidate security tools and standardize security policies across workflow',
          implementation: 'Use unified security platform and consistent security policy enforcement',
          tradeoffs: ['Less flexibility in security tool selection', 'Simpler security management and compliance'],
          goalAlignment: 0.8
        });
        break;
    }

    return improvements;
  }

  /**
   * Generate improvements based on workflow complexity
   */
  private generateComplexityBasedImprovements(structure: WorkflowStructure, goal: Goal): Improvement[] {
    const improvements: Improvement[] = [];
    const stageCount = structure.stages.length;
    const dependencyCount = structure.dependencies.length;

    if (stageCount > 8) {
      improvements.push({
        type: ImprovementType.ARCHITECTURE,
        priority: goal === Goal.SIMPLICITY ? Priority.HIGH : Priority.MEDIUM,
        description: `Workflow has ${stageCount} stages - consider breaking into smaller sub-workflows`,
        implementation: 'Split large workflow into focused sub-workflows with clear interfaces and responsibilities',
        tradeoffs: ['Additional coordination overhead', 'Better maintainability and parallel development'],
        goalAlignment: goal === Goal.SIMPLICITY ? 1.0 : 0.7
      });
    }

    if (dependencyCount > stageCount * 1.5) {
      improvements.push({
        type: ImprovementType.ARCHITECTURE,
        priority: Priority.MEDIUM,
        description: `High dependency ratio (${(dependencyCount/stageCount).toFixed(1)}) suggests tightly coupled design`,
        implementation: 'Reduce coupling by introducing event-driven communication and clearer stage boundaries',
        tradeoffs: ['May require architectural refactoring', 'Better modularity and independent stage development'],
        goalAlignment: goal === Goal.SIMPLICITY ? 0.9 : 0.6
      });
    }

    return improvements;
  }

  /**
   * Generate improvements based on stage relationships
   */
  private generateRelationshipBasedImprovements(structure: WorkflowStructure, goal: Goal): Improvement[] {
    const improvements: Improvement[] = [];

    // Find stages with no dependencies (potential starting points)
    const independentStages = structure.stages.filter(stage => 
      !structure.dependencies.some(dep => dep.to === stage.id)
    );

    // Find stages with no dependents (potential ending points)
    const terminalStages = structure.stages.filter(stage => 
      !structure.dependencies.some(dep => dep.from === stage.id)
    );

    if (independentStages.length > 3) {
      improvements.push({
        type: ImprovementType.ARCHITECTURE,
        priority: Priority.MEDIUM,
        description: `${independentStages.length} independent stages could benefit from coordinated triggering`,
        implementation: 'Add workflow orchestration to coordinate independent stages and prevent resource conflicts',
        tradeoffs: ['Additional orchestration complexity', 'Better resource utilization and execution coordination'],
        goalAlignment: goal === Goal.COST ? 0.8 : 0.6
      });
    }

    if (terminalStages.length > 2) {
      improvements.push({
        type: ImprovementType.MAINTAINABILITY,
        priority: Priority.LOW,
        description: `${terminalStages.length} terminal stages could benefit from consolidated reporting`,
        implementation: 'Add final consolidation stage to aggregate results and provide unified workflow status',
        tradeoffs: ['Additional stage complexity', 'Better workflow visibility and result aggregation'],
        goalAlignment: goal === Goal.SIMPLICITY ? 0.7 : 0.5
      });
    }

    return improvements;
  }

  /**
   * Generate fallback improvements when no specific improvements are found
   */
  private generateFallbackImprovements(goal: Goal, structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];
    
    switch (goal) {
      case Goal.RELIABILITY:
        improvements.push({
          type: ImprovementType.RELIABILITY,
          priority: Priority.MEDIUM,
          description: `Add comprehensive monitoring and alerting for all ${structure.stages.length} workflow stages`,
          implementation: 'Implement health checks, metrics collection, and alerting to improve workflow reliability',
          tradeoffs: ['Additional monitoring overhead', 'Better visibility and faster issue detection'],
          goalAlignment: 1.0
        });
        break;
        
      case Goal.COST:
        improvements.push({
          type: ImprovementType.COST,
          priority: Priority.MEDIUM,
          description: `Review resource allocation across ${structure.stages.length} stages for potential cost savings`,
          implementation: 'Analyze resource usage patterns and implement right-sizing and auto-scaling',
          tradeoffs: ['Initial analysis effort', 'Ongoing cost reductions'],
          goalAlignment: 1.0
        });
        break;
        
      case Goal.SIMPLICITY:
        // Generate both maintainability and architecture improvements for simplicity
        improvements.push({
          type: ImprovementType.MAINTAINABILITY,
          priority: Priority.MEDIUM,
          description: `Improve documentation and maintainability for ${structure.stages.length} workflow stages`,
          implementation: 'Add comprehensive documentation, standardize naming conventions, and simplify configurations',
          tradeoffs: ['Documentation effort', 'Better team understanding and maintenance'],
          goalAlignment: 1.0
        });
        improvements.push({
          type: ImprovementType.ARCHITECTURE,
          priority: Priority.MEDIUM,
          description: `Simplify workflow architecture to reduce complexity across ${structure.stages.length} stages`,
          implementation: 'Consolidate similar stages, reduce unnecessary dependencies, and streamline data flow',
          tradeoffs: ['Refactoring effort', 'Simpler architecture and easier maintenance'],
          goalAlignment: 0.9
        });
        break;
        
      default:
        improvements.push({
          type: ImprovementType.ARCHITECTURE,
          priority: Priority.LOW,
          description: 'Review workflow architecture for potential improvements',
          implementation: 'Conduct architectural review to identify optimization opportunities',
          tradeoffs: ['Review effort', 'Better overall design'],
          goalAlignment: 0.5
        });
        break;
    }
    
    return improvements;
  }

  /**
   * Generate reliability-focused optimizations
   */
  private generateReliabilityOptimizations(structure: WorkflowStructure, riskAnalysis: RiskAnalysis): Improvement[] {
    const improvements: Improvement[] = [];

    // Add redundancy suggestions
    const redundancySuggestions = this.generateRedundancySuggestions(structure, riskAnalysis.risks);
    improvements.push(...redundancySuggestions);

    // Add fault tolerance improvements
    const faultToleranceSuggestions = this.generateFaultToleranceSuggestions(structure);
    improvements.push(...faultToleranceSuggestions);

    // Add monitoring suggestions
    const monitoringSuggestions = this.generateMonitoringSuggestions(structure);
    improvements.push(...monitoringSuggestions);

    return improvements;
  }

  /**
   * Generate cost-focused optimizations
   */
  private generateCostOptimizations(structure: WorkflowStructure, riskAnalysis: RiskAnalysis): Improvement[] {
    const improvements: Improvement[] = [];

    // Resource efficiency suggestions
    const resourceEfficiencySuggestions = this.generateResourceEfficiencySuggestions(structure);
    improvements.push(...resourceEfficiencySuggestions);

    // Service consolidation suggestions
    const consolidationSuggestions = this.generateServiceConsolidationSuggestions(structure);
    improvements.push(...consolidationSuggestions);

    // Scaling cost optimizations
    const scalingSuggestions = this.generateScalingCostOptimizations(structure, riskAnalysis.bottlenecks);
    improvements.push(...scalingSuggestions);

    return improvements;
  }

  /**
   * Generate simplicity-focused optimizations
   */
  private generateSimplicityOptimizations(structure: WorkflowStructure, riskAnalysis: RiskAnalysis): Improvement[] {
    const improvements: Improvement[] = [];

    // Architectural complexity reduction
    const complexityReductions = this.generateComplexityReductions(structure);
    improvements.push(...complexityReductions);

    // Dependency reduction suggestions
    const dependencyReductions = this.generateDependencyReductions(structure);
    improvements.push(...dependencyReductions);

    // Maintainability improvements
    const maintainabilityImprovements = this.generateMaintainabilityImprovements(structure);
    improvements.push(...maintainabilityImprovements);

    return improvements;
  }

  /**
   * Identify complex dependency patterns
   */
  private identifyComplexDependencies(structure: WorkflowStructure): Array<{
    description: string;
    solution: string;
    tradeoffs: string[];
  }> {
    const complexities: Array<{
      description: string;
      solution: string;
      tradeoffs: string[];
    }> = [];

    // Find circular dependencies
    const circularDeps = this.findCircularDependencies(structure);
    if (circularDeps.length > 0) {
      complexities.push({
        description: `Found ${circularDeps.length} circular dependency patterns that complicate workflow execution`,
        solution: 'Break circular dependencies by introducing intermediate stages or event-driven communication',
        tradeoffs: ['May require additional coordination logic', 'Could increase latency in some paths']
      });
    }

    // Find overly complex dependency chains
    const complexChains = this.findComplexDependencyChains(structure);
    for (const chain of complexChains) {
      complexities.push({
        description: `Complex dependency chain with ${chain.length} stages reduces maintainability`,
        solution: 'Break long chains into smaller, more manageable segments with clear interfaces',
        tradeoffs: ['May require additional state management', 'Could introduce new coordination points']
      });
    }

    return complexities;
  }

  /**
   * Identify stage consolidation opportunities
   */
  private identifyStageConsolidation(structure: WorkflowStructure): Array<{
    description: string;
    solution: string;
    tradeoffs: string[];
  }> {
    const opportunities: Array<{
      description: string;
      solution: string;
      tradeoffs: string[];
    }> = [];

    // Find stages that could be merged
    const mergeCandidates = this.findMergeCandidates(structure);
    for (const candidate of mergeCandidates) {
      opportunities.push({
        description: `Stages "${candidate.stages.join('", "')}" perform similar functions and could be consolidated`,
        solution: 'Merge related stages into a single, more comprehensive stage',
        tradeoffs: ['Reduced modularity', 'Potential increase in stage complexity', 'Better resource utilization']
      });
    }

    return opportunities;
  }

  /**
   * Identify parallel optimization opportunities
   */
  private identifyParallelOptimizations(structure: WorkflowStructure): Array<{
    description: string;
    solution: string;
    tradeoffs: string[];
  }> {
    const optimizations: Array<{
      description: string;
      solution: string;
      tradeoffs: string[];
    }> = [];

    // Find stages that could run in parallel
    const parallelCandidates = this.findParallelizationCandidates(structure);
    for (const candidate of parallelCandidates) {
      optimizations.push({
        description: `Stages "${candidate.stages.join('", "')}" could be executed in parallel to improve performance`,
        solution: 'Restructure dependencies to allow parallel execution of independent stages',
        tradeoffs: ['Increased resource usage during parallel execution', 'Better overall throughput']
      });
    }

    // Find sequential chains that could benefit from pipeline parallelism
    const sequentialChains = this.findSequentialChains(structure);
    for (const chain of sequentialChains) {
      if (chain.length >= 4) {
        optimizations.push({
          description: `Sequential chain of ${chain.length} stages could benefit from pipeline parallelism`,
          solution: 'Implement pipeline parallelism to overlap execution of sequential stages',
          tradeoffs: ['Increased complexity in coordination', 'Better resource utilization', 'Reduced overall execution time']
        });
      }
    }

    return optimizations;
  }

  /**
   * Analyze trigger efficiency
   */
  private analyzeTriggerEfficiency(trigger: Trigger, structure: WorkflowStructure, goal: Goal): Improvement[] {
    const improvements: Improvement[] = [];

    // Check for inefficient trigger conditions
    if (trigger.condition && this.isInefficientTriggerCondition(trigger.condition)) {
      improvements.push({
        type: ImprovementType.PERFORMANCE,
        priority: goal === Goal.COST ? Priority.HIGH : Priority.MEDIUM,
        description: `Trigger "${trigger.id}" has inefficient condition that may cause unnecessary executions`,
        implementation: 'Optimize trigger condition to be more specific and reduce false positives',
        tradeoffs: ['May require more complex condition logic', 'Reduced unnecessary workflow executions'],
        goalAlignment: this.calculateGoalAlignment(ImprovementType.PERFORMANCE, goal)
      });
    }

    // Check for missing trigger optimizations
    if (trigger.type === TriggerType.SCHEDULE && !this.hasOptimalScheduling(trigger)) {
      improvements.push({
        type: ImprovementType.COST,
        priority: goal === Goal.COST ? Priority.HIGH : Priority.LOW,
        description: `Scheduled trigger "${trigger.id}" could be optimized for better resource utilization`,
        implementation: 'Adjust scheduling to align with resource availability and cost optimization',
        tradeoffs: ['May affect workflow timing', 'Better resource cost efficiency'],
        goalAlignment: this.calculateGoalAlignment(ImprovementType.COST, goal)
      });
    }

    return improvements;
  }

  /**
   * Generate missing steps from risks
   */
  private generateMissingStepsFromRisks(risks: Risk[], goal: Goal): MissingStep[] {
    const missingSteps: MissingStep[] = [];

    for (const risk of risks) {
      switch (risk.type) {
        case RiskType.MISSING_RETRY:
          missingSteps.push({
            id: `retry-${risk.affectedStages[0]}`,
            type: MissingStepType.ERROR_HANDLING,
            description: `Add retry mechanism for ${risk.description}`,
            suggestedLocation: `After stage ${risk.affectedStages[0]}`,
            priority: goal === Goal.RELIABILITY ? Priority.HIGH : Priority.MEDIUM,
            implementation: 'Implement exponential backoff retry policy with configurable max attempts'
          });
          break;
        case RiskType.SINGLE_POINT_OF_FAILURE:
          missingSteps.push({
            id: `monitoring-${risk.affectedStages[0]}`,
            type: MissingStepType.MONITORING,
            description: `Add monitoring for critical stage to detect failures early`,
            suggestedLocation: `Around stage ${risk.affectedStages[0]}`,
            priority: goal === Goal.RELIABILITY ? Priority.HIGH : Priority.MEDIUM,
            implementation: 'Add health checks and alerting for critical workflow stages'
          });
          break;
      }
    }

    return missingSteps;
  }

  /**
   * Generate missing steps from bottlenecks
   */
  private generateMissingStepsFromBottlenecks(bottlenecks: Bottleneck[], goal: Goal): MissingStep[] {
    const missingSteps: MissingStep[] = [];

    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case BottleneckType.RESOURCE:
          missingSteps.push({
            id: `validation-${bottleneck.id}`,
            type: MissingStepType.VALIDATION,
            description: 'Add resource availability validation before execution',
            suggestedLocation: `Before stages: ${bottleneck.affectedStages.join(', ')}`,
            priority: goal === Goal.COST ? Priority.HIGH : Priority.MEDIUM,
            implementation: 'Implement resource capacity checks and queuing mechanisms'
          });
          break;
        case BottleneckType.SEQUENTIAL:
          missingSteps.push({
            id: `cleanup-${bottleneck.id}`,
            type: MissingStepType.CLEANUP,
            description: 'Add cleanup steps to optimize resource usage in sequential chains',
            suggestedLocation: `Between stages in chain: ${bottleneck.affectedStages.join(' -> ')}`,
            priority: goal === Goal.COST ? Priority.MEDIUM : Priority.LOW,
            implementation: 'Add intermediate cleanup steps to free resources between sequential stages'
          });
          break;
      }
    }

    return missingSteps;
  }

  /**
   * Create refined workflow incorporating suggestions
   */
  private createRefinedWorkflow(
    originalWorkflow: WorkflowStructure, 
    improvements: Improvement[], 
    missingSteps: MissingStep[]
  ): WorkflowStructure {
    // Create a deep copy of the original workflow
    const refinedWorkflow: WorkflowStructure = JSON.parse(JSON.stringify(originalWorkflow));

    // Apply high-priority improvements to the refined workflow
    const highPriorityImprovements = improvements.filter(imp => imp.priority === Priority.HIGH);
    
    // Add missing steps as new stages
    for (const missingStep of missingSteps.filter(step => step.priority === Priority.HIGH)) {
      const newStage: Stage = {
        id: `added-${missingStep.id}`,
        name: missingStep.description,
        type: this.getStageTypeForMissingStep(missingStep.type),
        configuration: {
          description: missingStep.description,
          implementation: missingStep.implementation,
          addedByOptimization: true
        },
        dependencies: []
      };
      
      refinedWorkflow.stages.push(newStage);
    }

    // Update metadata to reflect refinements
    refinedWorkflow.metadata = {
      ...refinedWorkflow.metadata,
      name: `${refinedWorkflow.metadata.name} (Optimized)`,
      description: `${refinedWorkflow.metadata.description || ''} - Optimized with ${improvements.length} improvements and ${missingSteps.length} additional steps`,
      modified: new Date()
    };

    return refinedWorkflow;
  }

  /**
   * Helper methods for specific optimization types
   */
  private findCircularDependencies(structure: WorkflowStructure): string[][] {
    // Implementation for finding circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (stageId: string, path: string[]): void => {
      if (recursionStack.has(stageId)) {
        const cycleStart = path.indexOf(stageId);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(stageId)) return;

      visited.add(stageId);
      recursionStack.add(stageId);

      const outgoingDeps = structure.dependencies.filter(dep => dep.from === stageId);
      for (const dep of outgoingDeps) {
        dfs(dep.to, [...path, stageId]);
      }

      recursionStack.delete(stageId);
    };

    for (const stage of structure.stages) {
      if (!visited.has(stage.id)) {
        dfs(stage.id, []);
      }
    }

    return cycles;
  }

  private findComplexDependencyChains(structure: WorkflowStructure): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();

    const buildChain = (stageId: string): string[] => {
      const chain = [stageId];
      const outgoingDeps = structure.dependencies.filter(dep => dep.from === stageId);
      
      if (outgoingDeps.length === 1) {
        const nextStage = outgoingDeps[0].to;
        const incomingDeps = structure.dependencies.filter(dep => dep.to === nextStage);
        
        if (incomingDeps.length === 1 && !visited.has(nextStage)) {
          visited.add(nextStage);
          chain.push(...buildChain(nextStage));
        }
      }
      
      return chain;
    };

    for (const stage of structure.stages) {
      if (!visited.has(stage.id)) {
        visited.add(stage.id);
        const chain = buildChain(stage.id);
        if (chain.length > 5) { // Consider chains longer than 5 as complex
          chains.push(chain);
        }
      }
    }

    return chains;
  }

  private findMergeCandidates(structure: WorkflowStructure): Array<{ stages: string[] }> {
    const candidates: Array<{ stages: string[] }> = [];
    
    // Find stages with similar configurations or purposes
    for (let i = 0; i < structure.stages.length; i++) {
      for (let j = i + 1; j < structure.stages.length; j++) {
        const stage1 = structure.stages[i];
        const stage2 = structure.stages[j];
        
        if (this.areStagesSimilar(stage1, stage2) && this.canStagesBeMerged(stage1, stage2, structure)) {
          candidates.push({ stages: [stage1.id, stage2.id] });
        }
      }
    }
    
    return candidates;
  }

  private findParallelizationCandidates(structure: WorkflowStructure): Array<{ stages: string[] }> {
    const candidates: Array<{ stages: string[] }> = [];
    
    // Find stages that are currently sequential but could be parallel
    const sequentialChains = this.findSequentialChains(structure);
    
    for (const chain of sequentialChains) {
      const parallelizableSegments = this.findParallelizableSegments(chain, structure);
      candidates.push(...parallelizableSegments);
    }
    
    return candidates;
  }

  private calculateGoalAlignment(improvementType: ImprovementType, goal: Goal): number {
    const alignmentMatrix: Record<Goal, Record<ImprovementType, number>> = {
      [Goal.RELIABILITY]: {
        [ImprovementType.RELIABILITY]: 1.0,
        [ImprovementType.ARCHITECTURE]: 0.7,
        [ImprovementType.PERFORMANCE]: 0.6,
        [ImprovementType.COST]: 0.4,
        [ImprovementType.MAINTAINABILITY]: 0.8
      },
      [Goal.COST]: {
        [ImprovementType.COST]: 1.0,
        [ImprovementType.PERFORMANCE]: 0.8,
        [ImprovementType.ARCHITECTURE]: 0.6,
        [ImprovementType.RELIABILITY]: 0.5,
        [ImprovementType.MAINTAINABILITY]: 0.4
      },
      [Goal.SIMPLICITY]: {
        [ImprovementType.MAINTAINABILITY]: 1.0,
        [ImprovementType.ARCHITECTURE]: 0.9,
        [ImprovementType.PERFORMANCE]: 0.5,
        [ImprovementType.COST]: 0.6,
        [ImprovementType.RELIABILITY]: 0.7
      }
    };

    return alignmentMatrix[goal][improvementType] || 0.5;
  }

  private calculateConfidence(
    structure: WorkflowStructure, 
    improvements: Improvement[], 
    missingSteps: MissingStep[]
  ): number {
    let confidence = 0.8; // Base confidence

    // Increase confidence with more complete workflow information
    if (structure.stages.length > 0) confidence += 0.05;
    if (structure.dependencies.length > 0) confidence += 0.05;
    if (structure.triggers.length > 0) confidence += 0.03;
    if (structure.resources.length > 0) confidence += 0.02;

    // Increase confidence if we found actionable improvements
    if (improvements.length > 0) confidence += 0.05;
    if (missingSteps.length > 0) confidence += 0.03;

    // Decrease confidence if we found too many issues (might indicate complexity)
    const totalSuggestions = improvements.length + missingSteps.length;
    if (totalSuggestions > 15) confidence -= 0.1;
    if (totalSuggestions > 25) confidence -= 0.1;

    return Math.min(1.0, Math.max(0.1, confidence));
  }

  // Additional helper methods would be implemented here...
  private identifyMissingTriggers(structure: WorkflowStructure, goal: Goal): Improvement[] {
    // Implementation for identifying missing triggers
    return [];
  }

  private optimizeTriggerConditions(triggers: Trigger[], goal: Goal): Improvement[] {
    // Implementation for optimizing trigger conditions
    return [];
  }

  private generateRedundancySuggestions(structure: WorkflowStructure, risks: Risk[]): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Find single points of failure and suggest redundancy
    const spofRisks = risks.filter(risk => risk.type === RiskType.SINGLE_POINT_OF_FAILURE);
    for (const risk of spofRisks) {
      improvements.push({
        type: ImprovementType.RELIABILITY,
        priority: Priority.HIGH,
        description: `Add redundancy for critical stage "${risk.affectedStages[0]}" to eliminate single point of failure`,
        implementation: 'Implement backup instances or alternative execution paths for critical stages',
        tradeoffs: ['Increased resource costs', 'Better fault tolerance', 'More complex coordination'],
        goalAlignment: 1.0
      });
    }
    
    return improvements;
  }

  private generateFaultToleranceSuggestions(structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Suggest error handling for stages without retry policies
    const stagesWithoutRetry = structure.stages.filter(stage => !stage.retryPolicy);
    if (stagesWithoutRetry.length > 0) {
      improvements.push({
        type: ImprovementType.RELIABILITY,
        priority: Priority.MEDIUM,
        description: `Add retry policies to ${stagesWithoutRetry.length} stages lacking error handling`,
        implementation: 'Implement exponential backoff retry mechanisms with configurable max attempts',
        tradeoffs: ['Increased execution time on failures', 'Better resilience to transient errors'],
        goalAlignment: 1.0
      });
    }
    
    return improvements;
  }

  private generateMonitoringSuggestions(structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Suggest monitoring for critical stages
    const criticalStages = structure.stages.filter(stage => 
      structure.dependencies.filter(dep => dep.from === stage.id).length > 2
    );
    
    if (criticalStages.length > 0) {
      improvements.push({
        type: ImprovementType.RELIABILITY,
        priority: Priority.MEDIUM,
        description: `Add monitoring and alerting for ${criticalStages.length} critical stages`,
        implementation: 'Implement health checks, metrics collection, and alerting for critical workflow components',
        tradeoffs: ['Additional monitoring overhead', 'Better visibility into workflow health'],
        goalAlignment: 0.9
      });
    }
    
    return improvements;
  }

  private generateResourceEfficiencySuggestions(structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Suggest resource optimization for resource-intensive stages
    const resourceIntensiveStages = structure.stages.filter(stage => 
      stage.configuration && 
      (stage.configuration.cpu || stage.configuration.memory || stage.configuration.storage)
    );
    
    if (resourceIntensiveStages.length > 0) {
      improvements.push({
        type: ImprovementType.COST,
        priority: Priority.HIGH,
        description: `Optimize resource allocation for ${resourceIntensiveStages.length} resource-intensive stages`,
        implementation: 'Right-size resource allocations based on actual usage patterns and implement auto-scaling',
        tradeoffs: ['Potential performance impact during scaling', 'Significant cost savings'],
        goalAlignment: 1.0
      });
    }
    
    return improvements;
  }

  private generateServiceConsolidationSuggestions(structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Find stages that could be consolidated
    const consolidationCandidates = this.findMergeCandidates(structure);
    if (consolidationCandidates.length > 0) {
      improvements.push({
        type: ImprovementType.COST,
        priority: Priority.MEDIUM,
        description: `Consolidate ${consolidationCandidates.length} groups of similar stages to reduce overhead`,
        implementation: 'Merge functionally similar stages to reduce service overhead and management complexity',
        tradeoffs: ['Reduced modularity', 'Lower operational costs', 'Simplified deployment'],
        goalAlignment: 0.8
      });
    }
    
    return improvements;
  }

  private generateScalingCostOptimizations(structure: WorkflowStructure, bottlenecks: Bottleneck[]): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Optimize scaling for bottlenecks
    const resourceBottlenecks = bottlenecks.filter(b => b.type === BottleneckType.RESOURCE);
    if (resourceBottlenecks.length > 0) {
      improvements.push({
        type: ImprovementType.COST,
        priority: Priority.HIGH,
        description: `Implement cost-effective scaling strategies for ${resourceBottlenecks.length} resource bottlenecks`,
        implementation: 'Use predictive scaling and spot instances to optimize costs while maintaining performance',
        tradeoffs: ['Potential availability risks with spot instances', 'Significant cost reductions'],
        goalAlignment: 1.0
      });
    }
    
    return improvements;
  }

  private generateComplexityReductions(structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Suggest simplification for overly complex workflows
    if (structure.stages.length > 10) {
      improvements.push({
        type: ImprovementType.MAINTAINABILITY,
        priority: Priority.HIGH,
        description: `Workflow has ${structure.stages.length} stages - consider breaking into smaller, manageable components`,
        implementation: 'Split large workflows into smaller, focused sub-workflows with clear interfaces',
        tradeoffs: ['Additional coordination overhead', 'Better maintainability and testing'],
        goalAlignment: 1.0
      });
    }
    
    return improvements;
  }

  private generateDependencyReductions(structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Find complex dependency patterns
    const complexDependencies = structure.dependencies.length;
    const stages = structure.stages.length;
    const dependencyRatio = complexDependencies / Math.max(stages, 1);
    
    if (dependencyRatio > 1.5) {
      improvements.push({
        type: ImprovementType.MAINTAINABILITY,
        priority: Priority.MEDIUM,
        description: `High dependency ratio (${dependencyRatio.toFixed(1)}) indicates overly coupled workflow design`,
        implementation: 'Reduce coupling by introducing event-driven communication and clearer stage boundaries',
        tradeoffs: ['May require architectural changes', 'Better modularity and maintainability'],
        goalAlignment: 0.9
      });
    }
    
    return improvements;
  }

  private generateMaintainabilityImprovements(structure: WorkflowStructure): Improvement[] {
    const improvements: Improvement[] = [];
    
    // Suggest documentation improvements
    const undocumentedStages = structure.stages.filter(stage => 
      !stage.configuration?.description || stage.configuration.description.length < 10
    );
    
    if (undocumentedStages.length > 0) {
      improvements.push({
        type: ImprovementType.MAINTAINABILITY,
        priority: Priority.LOW,
        description: `${undocumentedStages.length} stages lack adequate documentation`,
        implementation: 'Add comprehensive documentation for all workflow stages including purpose, inputs, and outputs',
        tradeoffs: ['Additional documentation overhead', 'Better team understanding and maintenance'],
        goalAlignment: 0.8
      });
    }
    
    return improvements;
  }

  private isInefficientTriggerCondition(condition: string): boolean {
    // Implementation for checking inefficient trigger conditions
    return condition.includes('*') || condition.length > 100;
  }

  private hasOptimalScheduling(trigger: Trigger): boolean {
    // Implementation for checking optimal scheduling
    return trigger.condition.includes('cron') || trigger.condition.includes('rate');
  }

  private getStageTypeForMissingStep(stepType: MissingStepType): StageType {
    const typeMap: Record<MissingStepType, StageType> = {
      [MissingStepType.VALIDATION]: StageType.CONDITION,
      [MissingStepType.ERROR_HANDLING]: StageType.TASK,
      [MissingStepType.MONITORING]: StageType.TASK,
      [MissingStepType.CLEANUP]: StageType.TASK,
      [MissingStepType.NOTIFICATION]: StageType.TASK
    };
    
    return typeMap[stepType] || StageType.TASK;
  }

  private areStagesSimilar(stage1: Stage, stage2: Stage): boolean {
    // Simple similarity check based on type and configuration
    return stage1.type === stage2.type && 
           JSON.stringify(stage1.configuration).length < 200 &&
           JSON.stringify(stage2.configuration).length < 200;
  }

  private canStagesBeMerged(stage1: Stage, stage2: Stage, structure: WorkflowStructure): boolean {
    // Check if stages can be merged without breaking dependencies
    const stage1Deps = structure.dependencies.filter(dep => dep.from === stage1.id || dep.to === stage1.id);
    const stage2Deps = structure.dependencies.filter(dep => dep.from === stage2.id || dep.to === stage2.id);
    
    // Simple heuristic: stages with few dependencies can potentially be merged
    return stage1Deps.length <= 2 && stage2Deps.length <= 2;
  }

  private findSequentialChains(structure: WorkflowStructure): string[][] {
    // Reuse logic from RiskAnalyzerAgent or implement similar
    const chains: string[][] = [];
    const visited = new Set<string>();
    
    for (const stage of structure.stages) {
      if (!visited.has(stage.id)) {
        const chain = this.buildSequentialChain(stage.id, structure, visited);
        if (chain.length > 1) {
          chains.push(chain);
        }
      }
    }
    
    return chains;
  }

  private buildSequentialChain(stageId: string, structure: WorkflowStructure, visited: Set<string>): string[] {
    const chain = [stageId];
    visited.add(stageId);
    
    const outgoingDeps = structure.dependencies.filter(
      dep => dep.from === stageId && dep.type === DependencyType.SEQUENTIAL
    );
    
    if (outgoingDeps.length === 1) {
      const nextStageId = outgoingDeps[0].to;
      const incomingDeps = structure.dependencies.filter(dep => dep.to === nextStageId);
      
      if (incomingDeps.length === 1 && !visited.has(nextStageId)) {
        const nextChain = this.buildSequentialChain(nextStageId, structure, visited);
        chain.push(...nextChain.slice(1));
      }
    }
    
    return chain;
  }

  private findParallelizableSegments(chain: string[], structure: WorkflowStructure): Array<{ stages: string[] }> {
    const segments: Array<{ stages: string[] }> = [];
    
    // Look for segments within the chain that could be parallelized
    for (let i = 0; i < chain.length - 1; i++) {
      for (let j = i + 2; j < chain.length; j++) {
        const segment = chain.slice(i, j + 1);
        if (this.canSegmentBeParallelized(segment, structure)) {
          segments.push({ stages: segment });
        }
      }
    }
    
    return segments;
  }

  private canSegmentBeParallelized(segment: string[], structure: WorkflowStructure): boolean {
    // For segments in a sequential chain, we can suggest parallelization if:
    // 1. The segment has at least 2 stages
    // 2. The stages don't have strict data dependencies (allowing for pipeline parallelism)
    
    if (segment.length < 2) {
      return false;
    }
    
    // Check if this is a purely sequential chain that could benefit from pipeline parallelism
    // or if some stages could be restructured to run in parallel
    const hasOnlySequentialDeps = segment.every((stage, index) => {
      if (index === segment.length - 1) return true; // Last stage has no outgoing deps in segment
      
      const nextStage = segment[index + 1];
      const dep = structure.dependencies.find(
        d => d.from === stage && d.to === nextStage
      );
      
      return dep && dep.type === DependencyType.SEQUENTIAL;
    });
    
    // If it's a purely sequential chain, it's a candidate for pipeline parallelism
    // or for restructuring some stages to run in parallel
    return hasOnlySequentialDeps && segment.length >= 3;
  }
}
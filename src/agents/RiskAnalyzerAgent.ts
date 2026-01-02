import { 
  WorkflowStructure, 
  Stage, 
  Dependency, 
  DependencyType,
  StageType 
} from '../types/workflow';
import { 
  Risk, 
  RiskType, 
  Severity, 
  Bottleneck, 
  BottleneckType, 
  Impact 
} from '../types/analysis';
import { Goal, GoalContext } from '../types/goals';

export interface RiskAnalysis {
  risks: Risk[];
  bottlenecks: Bottleneck[];
  confidence: number;
}

export class RiskAnalyzerAgent {
  /**
   * Main analysis method that identifies risks and bottlenecks in the workflow
   */
  async analyzeRisks(structure: WorkflowStructure, goal: Goal): Promise<RiskAnalysis> {
    const risks: Risk[] = [];
    const bottlenecks: Bottleneck[] = [];

    // Generate content-aware risks first
    const contentAwareRisks = this.generateContentAwareRisks(structure, goal);
    risks.push(...contentAwareRisks);

    // Detect single points of failure
    const spofRisks = this.detectSinglePointsOfFailure(structure);
    risks.push(...spofRisks);

    // Analyze retry policies
    const retryRisks = this.analyzeRetryPolicies(structure);
    risks.push(...retryRisks);

    // Identify scaling bottlenecks
    const scalingBottlenecks = this.identifyScalingBottlenecks(structure);
    bottlenecks.push(...scalingBottlenecks);

    // Apply goal-specific risk prioritization
    this.prioritizeRisksByGoal(risks, goal);
    this.prioritizeBottlenecksByGoal(bottlenecks, goal);

    return {
      risks,
      bottlenecks,
      confidence: this.calculateConfidence(structure, risks, bottlenecks)
    };
  }

  /**
   * Generate content-aware risks based on workflow patterns
   */
  private generateContentAwareRisks(structure: WorkflowStructure, goal: Goal): Risk[] {
    const risks: Risk[] = [];

    // Analyze stage content for risk patterns
    const stageContent = structure.stages.map(stage => ({
      id: stage.id,
      name: stage.name.toLowerCase(),
      description: (stage.configuration?.description || '').toLowerCase(),
      combined: `${stage.name} ${stage.configuration?.description || ''}`.toLowerCase()
    }));

    // Check for deployment-related risks
    const deploymentStages = stageContent.filter(stage => 
      ['deploy', 'release', 'publish', 'production'].some(keyword => stage.combined.includes(keyword))
    );

    if (deploymentStages.length > 0) {
      risks.push({
        type: RiskType.SINGLE_POINT_OF_FAILURE,
        severity: Severity.HIGH,
        description: `Deployment stages (${deploymentStages.map(s => s.id).join(', ')}) lack rollback mechanisms`,
        affectedStages: deploymentStages.map(s => s.id),
        mitigation: 'Implement automated rollback procedures and deployment health checks'
      });
    }

    // Check for data processing risks
    const dataStages = stageContent.filter(stage => 
      ['process', 'transform', 'etl', 'data', 'parse'].some(keyword => stage.combined.includes(keyword))
    );

    if (dataStages.length > 0) {
      risks.push({
        type: RiskType.MISSING_RETRY,
        severity: Severity.MEDIUM,
        description: `Data processing stages (${dataStages.map(s => s.id).join(', ')}) may fail on corrupted or unexpected data`,
        affectedStages: dataStages.map(s => s.id),
        mitigation: 'Add data validation, error handling, and retry logic for data processing failures'
      });
    }

    // Check for external dependency risks
    const externalStages = stageContent.filter(stage => 
      ['api', 'service', 'external', 'third-party', 'webhook'].some(keyword => stage.combined.includes(keyword))
    );

    if (externalStages.length > 0) {
      risks.push({
        type: RiskType.SINGLE_POINT_OF_FAILURE,
        severity: Severity.MEDIUM,
        description: `External service dependencies (${externalStages.map(s => s.id).join(', ')}) may be unavailable`,
        affectedStages: externalStages.map(s => s.id),
        mitigation: 'Implement circuit breakers, timeouts, and fallback mechanisms for external services'
      });
    }

    // Check for approval bottleneck risks
    const approvalStages = stageContent.filter(stage => 
      ['approve', 'review', 'manual', 'human'].some(keyword => stage.combined.includes(keyword))
    );

    if (approvalStages.length > 1) {
      risks.push({
        type: RiskType.SCALING_ISSUE,
        severity: Severity.MEDIUM,
        description: `Multiple approval stages (${approvalStages.map(s => s.id).join(', ')}) may create workflow delays`,
        affectedStages: approvalStages.map(s => s.id),
        mitigation: 'Consider parallel approvals or risk-based approval routing to reduce delays'
      });
    }

    return risks;
  }

  /**
   * Detect single points of failure in the workflow
   */
  private detectSinglePointsOfFailure(structure: WorkflowStructure): Risk[] {
    const risks: Risk[] = [];
    const stageMap = new Map(structure.stages.map(stage => [stage.id, stage]));

    // Find stages with no alternatives or redundancy
    for (const stage of structure.stages) {
      const incomingDeps = structure.dependencies.filter(dep => dep.to === stage.id);
      const outgoingDeps = structure.dependencies.filter(dep => dep.from === stage.id);

      // Check if stage is critical (has multiple dependents but no alternatives)
      if (outgoingDeps.length > 1 && !this.hasAlternativePath(stage.id, structure)) {
        risks.push({
          type: RiskType.SINGLE_POINT_OF_FAILURE,
          severity: this.calculateSPOFSeverity(outgoingDeps.length),
          description: `Stage "${stage.name}" is a single point of failure with ${outgoingDeps.length} dependent stages`,
          affectedStages: [stage.id, ...outgoingDeps.map(dep => dep.to)],
          mitigation: 'Consider adding redundant paths or implementing failover mechanisms'
        });
      }

      // Check for stages with no error handling
      if (!stage.retryPolicy && this.isCriticalStage(stage, structure)) {
        risks.push({
          type: RiskType.SINGLE_POINT_OF_FAILURE,
          severity: Severity.MEDIUM,
          description: `Critical stage "${stage.name}" lacks error handling mechanisms`,
          affectedStages: [stage.id],
          mitigation: 'Add retry policies and error handling to critical stages'
        });
      }
    }

    // Check for resource dependencies that could be SPOFs
    const resourceRisks = this.analyzeResourceSPOFs(structure);
    risks.push(...resourceRisks);

    return risks;
  }

  /**
   * Analyze retry policies across the workflow
   */
  private analyzeRetryPolicies(structure: WorkflowStructure): Risk[] {
    const risks: Risk[] = [];

    for (const stage of structure.stages) {
      // Check for missing retry policies on critical stages
      if (!stage.retryPolicy && this.isCriticalStage(stage, structure)) {
        risks.push({
          type: RiskType.MISSING_RETRY,
          severity: Severity.MEDIUM,
          description: `Critical stage "${stage.name}" lacks retry policy`,
          affectedStages: [stage.id],
          mitigation: 'Implement retry policy with exponential backoff for transient failures'
        });
      }

      // Check for inadequate retry configurations
      if (stage.retryPolicy) {
        if (stage.retryPolicy.maxAttempts < 2) {
          risks.push({
            type: RiskType.MISSING_RETRY,
            severity: Severity.LOW,
            description: `Stage "${stage.name}" has insufficient retry attempts (${stage.retryPolicy.maxAttempts})`,
            affectedStages: [stage.id],
            mitigation: 'Increase retry attempts to at least 3 for better resilience'
          });
        }

        if (!stage.retryPolicy.retryConditions || stage.retryPolicy.retryConditions.length === 0) {
          risks.push({
            type: RiskType.MISSING_RETRY,
            severity: Severity.LOW,
            description: `Stage "${stage.name}" has retry policy but no specific retry conditions`,
            affectedStages: [stage.id],
            mitigation: 'Define specific conditions for retries (e.g., network errors, timeouts)'
          });
        }
      }
    }

    return risks;
  }

  /**
   * Identify scaling bottlenecks in the workflow
   */
  private identifyScalingBottlenecks(structure: WorkflowStructure): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Analyze sequential dependencies that could limit parallelization
    const sequentialBottlenecks = this.analyzeSequentialBottlenecks(structure);
    bottlenecks.push(...sequentialBottlenecks);

    // Analyze resource bottlenecks
    const resourceBottlenecks = this.analyzeResourceBottlenecks(structure);
    bottlenecks.push(...resourceBottlenecks);

    // Analyze dependency bottlenecks
    const dependencyBottlenecks = this.analyzeDependencyBottlenecks(structure);
    bottlenecks.push(...dependencyBottlenecks);

    return bottlenecks;
  }

  /**
   * Check if a stage has alternative execution paths
   */
  private hasAlternativePath(stageId: string, structure: WorkflowStructure): boolean {
    const outgoingDeps = structure.dependencies.filter(dep => dep.from === stageId);
    
    // Simple heuristic: if there are conditional dependencies, there might be alternatives
    return outgoingDeps.some(dep => dep.type === DependencyType.CONDITIONAL);
  }

  /**
   * Determine if a stage is critical based on its position and dependencies
   */
  private isCriticalStage(stage: Stage, structure: WorkflowStructure): boolean {
    const outgoingDeps = structure.dependencies.filter(dep => dep.from === stage.id);
    const incomingDeps = structure.dependencies.filter(dep => dep.to === stage.id);

    // Stage is critical if it has multiple dependents or is a gateway stage
    return outgoingDeps.length > 1 || 
           (incomingDeps.length > 1 && outgoingDeps.length > 0) ||
           stage.type === StageType.CONDITION;
  }

  /**
   * Calculate severity of single point of failure based on impact
   */
  private calculateSPOFSeverity(dependentCount: number): Severity {
    if (dependentCount >= 5) return Severity.CRITICAL;
    if (dependentCount >= 3) return Severity.HIGH;
    if (dependentCount >= 2) return Severity.MEDIUM;
    return Severity.LOW;
  }

  /**
   * Analyze resource-related single points of failure
   */
  private analyzeResourceSPOFs(structure: WorkflowStructure): Risk[] {
    const risks: Risk[] = [];
    const resourceUsage = new Map<string, string[]>();

    // Track which stages use which resources
    for (const stage of structure.stages) {
      if (stage.configuration.resources) {
        const resources = Array.isArray(stage.configuration.resources) 
          ? stage.configuration.resources 
          : [stage.configuration.resources];
        
        for (const resource of resources) {
          if (!resourceUsage.has(resource)) {
            resourceUsage.set(resource, []);
          }
          resourceUsage.get(resource)!.push(stage.id);
        }
      }
    }

    // Identify resources used by multiple stages (potential SPOFs)
    for (const [resource, stages] of Array.from(resourceUsage.entries())) {
      if (stages.length > 2) {
        risks.push({
          type: RiskType.SINGLE_POINT_OF_FAILURE,
          severity: this.calculateSPOFSeverity(stages.length),
          description: `Resource "${resource}" is a potential single point of failure used by ${stages.length} stages`,
          affectedStages: stages,
          mitigation: 'Consider resource redundancy or load balancing across multiple instances'
        });
      }
    }

    return risks;
  }

  /**
   * Analyze sequential execution bottlenecks
   */
  private analyzeSequentialBottlenecks(structure: WorkflowStructure): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    
    // Find long sequential chains that could be parallelized
    const chains = this.findSequentialChains(structure);
    
    for (const chain of chains) {
      if (chain.length >= 4) { // Chains of 4+ stages might benefit from parallelization
        bottlenecks.push({
          id: `sequential-${chain[0]}-${chain[chain.length - 1]}`,
          type: BottleneckType.SEQUENTIAL,
          description: `Long sequential chain of ${chain.length} stages limits parallelization`,
          affectedStages: chain,
          impact: chain.length >= 6 ? Impact.HIGH : Impact.MEDIUM,
          suggestions: [
            'Analyze if some stages can be executed in parallel',
            'Consider breaking the chain into smaller parallel segments',
            'Implement pipeline parallelism where possible'
          ]
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Analyze resource-related bottlenecks
   */
  private analyzeResourceBottlenecks(structure: WorkflowStructure): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    
    // Analyze resource contention
    const resourceContention = this.analyzeResourceContention(structure);
    
    for (const [resource, contention] of Array.from(resourceContention.entries())) {
      if (contention.stages.length > 2 && contention.concurrent) {
        bottlenecks.push({
          id: `resource-${resource}`,
          type: BottleneckType.RESOURCE,
          description: `Resource "${resource}" may experience contention from ${contention.stages.length} concurrent stages`,
          affectedStages: contention.stages,
          impact: contention.stages.length > 4 ? Impact.HIGH : Impact.MEDIUM,
          suggestions: [
            'Scale resource capacity to handle concurrent access',
            'Implement resource pooling or queuing',
            'Consider resource partitioning strategies'
          ]
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Analyze dependency-related bottlenecks
   */
  private analyzeDependencyBottlenecks(structure: WorkflowStructure): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    
    // Find stages with many dependencies (potential coordination bottlenecks)
    for (const stage of structure.stages) {
      const incomingDeps = structure.dependencies.filter(dep => dep.to === stage.id);
      
      if (incomingDeps.length >= 4) {
        bottlenecks.push({
          id: `dependency-${stage.id}`,
          type: BottleneckType.DEPENDENCY,
          description: `Stage "${stage.name}" waits for ${incomingDeps.length} dependencies, creating coordination overhead`,
          affectedStages: [stage.id, ...incomingDeps.map(dep => dep.from)],
          impact: incomingDeps.length >= 6 ? Impact.HIGH : Impact.MEDIUM,
          suggestions: [
            'Consider reducing the number of dependencies',
            'Implement partial dependency satisfaction',
            'Use event-driven coordination instead of direct dependencies'
          ]
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Find sequential chains in the workflow
   */
  private findSequentialChains(structure: WorkflowStructure): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();
    
    for (const stage of structure.stages) {
      if (!visited.has(stage.id)) {
        const chain = this.buildChainFromStage(stage.id, structure, visited);
        if (chain.length > 1) {
          chains.push(chain);
        }
      }
    }
    
    return chains;
  }

  /**
   * Build a sequential chain starting from a stage
   */
  private buildChainFromStage(stageId: string, structure: WorkflowStructure, visited: Set<string>): string[] {
    const chain = [stageId];
    visited.add(stageId);
    
    // Follow sequential dependencies
    const outgoingDeps = structure.dependencies.filter(
      dep => dep.from === stageId && dep.type === DependencyType.SEQUENTIAL
    );
    
    // Only continue chain if there's exactly one sequential dependency
    if (outgoingDeps.length === 1) {
      const nextStageId = outgoingDeps[0].to;
      const incomingDeps = structure.dependencies.filter(dep => dep.to === nextStageId);
      
      // Only continue if the next stage has only one incoming dependency
      if (incomingDeps.length === 1 && !visited.has(nextStageId)) {
        const nextChain = this.buildChainFromStage(nextStageId, structure, visited);
        chain.push(...nextChain.slice(1)); // Avoid duplicating the first element
      }
    }
    
    return chain;
  }

  /**
   * Analyze resource contention patterns
   */
  private analyzeResourceContention(structure: WorkflowStructure): Map<string, { stages: string[], concurrent: boolean }> {
    const contention = new Map<string, { stages: string[], concurrent: boolean }>();
    
    // Build resource usage map
    for (const stage of structure.stages) {
      if (stage.configuration.resources) {
        const resources = Array.isArray(stage.configuration.resources) 
          ? stage.configuration.resources 
          : [stage.configuration.resources];
        
        for (const resource of resources) {
          if (!contention.has(resource)) {
            contention.set(resource, { stages: [], concurrent: false });
          }
          contention.get(resource)!.stages.push(stage.id);
        }
      }
    }
    
    // Determine if stages using the same resource can run concurrently
    for (const [resource, info] of Array.from(contention.entries())) {
      info.concurrent = this.canStagesRunConcurrently(info.stages, structure);
    }
    
    return contention;
  }

  /**
   * Check if stages can potentially run concurrently
   */
  private canStagesRunConcurrently(stageIds: string[], structure: WorkflowStructure): boolean {
    // Simple heuristic: if stages are not in a direct dependency chain, they might run concurrently
    for (let i = 0; i < stageIds.length; i++) {
      for (let j = i + 1; j < stageIds.length; j++) {
        if (this.areStagesInDependencyChain(stageIds[i], stageIds[j], structure)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if two stages are in a dependency chain
   */
  private areStagesInDependencyChain(stage1: string, stage2: string, structure: WorkflowStructure): boolean {
    return this.isStageReachable(stage1, stage2, structure) || 
           this.isStageReachable(stage2, stage1, structure);
  }

  /**
   * Check if one stage is reachable from another through dependencies
   */
  private isStageReachable(from: string, to: string, structure: WorkflowStructure): boolean {
    const visited = new Set<string>();
    const queue = [from];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === to) return true;
      if (visited.has(current)) continue;
      
      visited.add(current);
      const outgoingDeps = structure.dependencies.filter(dep => dep.from === current);
      queue.push(...outgoingDeps.map(dep => dep.to));
    }
    
    return false;
  }

  /**
   * Apply goal-specific prioritization to risks
   */
  private prioritizeRisksByGoal(risks: Risk[], goal: Goal): void {
    for (const risk of risks) {
      switch (goal) {
        case Goal.RELIABILITY:
          // Increase severity for reliability-related risks
          if (risk.type === RiskType.SINGLE_POINT_OF_FAILURE || risk.type === RiskType.MISSING_RETRY) {
            risk.severity = this.increaseSeverity(risk.severity);
          }
          break;
        case Goal.COST:
          // Focus on scaling and resource-related risks
          if (risk.type === RiskType.SCALING_ISSUE) {
            risk.severity = this.increaseSeverity(risk.severity);
          }
          break;
        case Goal.SIMPLICITY:
          // Lower priority for complex reliability measures
          if (risk.type === RiskType.MISSING_RETRY && risk.severity === Severity.LOW) {
            // Keep low priority for simple workflows
          }
          break;
      }
    }
  }

  /**
   * Apply goal-specific prioritization to bottlenecks
   */
  private prioritizeBottlenecksByGoal(bottlenecks: Bottleneck[], goal: Goal): void {
    for (const bottleneck of bottlenecks) {
      switch (goal) {
        case Goal.COST:
          // Increase impact for resource bottlenecks
          if (bottleneck.type === BottleneckType.RESOURCE) {
            bottleneck.impact = this.increaseImpact(bottleneck.impact);
          }
          break;
        case Goal.SIMPLICITY:
          // Increase impact for dependency bottlenecks
          if (bottleneck.type === BottleneckType.DEPENDENCY) {
            bottleneck.impact = this.increaseImpact(bottleneck.impact);
          }
          break;
      }
    }
  }

  /**
   * Increase severity level
   */
  private increaseSeverity(severity: Severity): Severity {
    switch (severity) {
      case Severity.LOW: return Severity.MEDIUM;
      case Severity.MEDIUM: return Severity.HIGH;
      case Severity.HIGH: return Severity.CRITICAL;
      case Severity.CRITICAL: return Severity.CRITICAL;
    }
  }

  /**
   * Increase impact level
   */
  private increaseImpact(impact: Impact): Impact {
    switch (impact) {
      case Impact.LOW: return Impact.MEDIUM;
      case Impact.MEDIUM: return Impact.HIGH;
      case Impact.HIGH: return Impact.HIGH;
    }
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateConfidence(structure: WorkflowStructure, risks: Risk[], bottlenecks: Bottleneck[]): number {
    let confidence = 0.8; // Base confidence
    
    // Increase confidence with more complete workflow information
    if (structure.stages.length > 0) confidence += 0.1;
    if (structure.dependencies.length > 0) confidence += 0.05;
    if (structure.triggers.length > 0) confidence += 0.02;
    if (structure.resources.length > 0) confidence += 0.03;
    
    // Decrease confidence if analysis found many issues (might indicate incomplete understanding)
    const totalIssues = risks.length + bottlenecks.length;
    if (totalIssues > 10) confidence -= 0.1;
    if (totalIssues > 20) confidence -= 0.1;
    
    return Math.min(1.0, Math.max(0.1, confidence));
  }
}
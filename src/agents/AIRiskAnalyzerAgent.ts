import { AIAgent, AIAnalysisResult } from './AIAgent';
import { WorkflowStructure } from '../types/workflow';
import { Goal } from '../types/goals';
import { Risk, RiskType, Severity, Bottleneck, BottleneckType, Impact } from '../types/analysis';

export interface AIRiskAnalysisResult {
  risks: Risk[];
  bottlenecks: Bottleneck[];
  aiAnalysis: AIAnalysisResult;
  confidence: number;
}

export class AIRiskAnalyzerAgent extends AIAgent {
  /**
   * Analyze workflow using AI for risk identification
   */
  async analyzeWorkflow(
    workflowText: string,
    structure: WorkflowStructure,
    goal: Goal,
    context?: any
  ): Promise<AIAnalysisResult> {
    const systemPrompt = this.buildRiskAnalysisSystemPrompt(goal);
    const userPrompt = this.buildRiskAnalysisUserPrompt(workflowText, structure, goal);
    
    const response = await this.callAI(userPrompt, systemPrompt);
    return this.parseAIResponse(response);
  }

  /**
   * Generate AI-powered risk analysis
   */
  async analyzeRisks(
    workflowText: string,
    structure: WorkflowStructure,
    goal: Goal
  ): Promise<AIRiskAnalysisResult> {
    const aiAnalysis = await this.analyzeWorkflow(workflowText, structure, goal);
    const { risks, bottlenecks } = this.convertAIAnalysisToRisksAndBottlenecks(aiAnalysis, structure);
    
    return {
      risks,
      bottlenecks,
      aiAnalysis,
      confidence: aiAnalysis.confidence
    };
  }

  /**
   * Build system prompt for risk analysis
   */
  private buildRiskAnalysisSystemPrompt(goal: Goal): string {
    return `You are an expert workflow risk analyst and security consultant. Your task is to identify potential risks, vulnerabilities, and bottlenecks in workflows.

ANALYSIS FOCUS: ${goal.toUpperCase()} optimization context
${this.getRiskAnalysisGoalContext(goal)}

RISK ANALYSIS REQUIREMENTS:
1. Identify single points of failure
2. Detect potential bottlenecks and scaling issues
3. Assess error handling and recovery mechanisms
4. Evaluate security vulnerabilities
5. Identify dependency risks and external service failures
6. Assess data integrity and processing risks
7. Evaluate resource constraints and capacity issues

RESPONSE FORMAT:
Provide your response as a JSON object with this structure:
{
  "analysis": "Overall risk assessment of the workflow",
  "suggestions": [
    "RISK: [Risk Type] - [Description] - Severity: [HIGH/MEDIUM/LOW] - Affected: [stage names]",
    "BOTTLENECK: [Bottleneck Type] - [Description] - Impact: [HIGH/MEDIUM/LOW] - Affected: [stage names]",
    "..."
  ],
  "confidence": 0.85,
  "reasoning": "Explanation of risk analysis methodology and confidence assessment"
}

RISK CATEGORIES:
- Single Point of Failure: Critical components without redundancy
- Missing Retry: Lack of error handling and retry mechanisms
- Scaling Issue: Bottlenecks that prevent horizontal scaling
- Security Risk: Vulnerabilities and security gaps
- Data Risk: Data integrity and processing issues
- Dependency Risk: External service and resource dependencies

BOTTLENECK CATEGORIES:
- Sequential: Unnecessary sequential processing
- Resource: Resource contention and capacity limits
- Dependency: Complex dependency chains causing delays`;
  }

  /**
   * Get goal-specific risk analysis context
   */
  private getRiskAnalysisGoalContext(goal: Goal): string {
    switch (goal) {
      case Goal.RELIABILITY:
        return `Prioritize identifying reliability risks, fault tolerance gaps, and resilience issues.
        Focus on failure modes, recovery mechanisms, and system stability risks.`;
      
      case Goal.COST:
        return `Prioritize identifying cost-related risks, resource waste, and scaling inefficiencies.
        Focus on resource optimization opportunities and cost escalation risks.`;
      
      case Goal.SIMPLICITY:
        return `Prioritize identifying complexity-related risks, maintainability issues, and operational overhead.
        Focus on architectural complexity and maintenance burden risks.`;
      
      default:
        return `Provide comprehensive risk analysis across reliability, cost, and operational complexity.`;
    }
  }

  /**
   * Build user prompt for risk analysis
   */
  private buildRiskAnalysisUserPrompt(workflowText: string, structure: WorkflowStructure, goal: Goal): string {
    const structureInfo = this.summarizeStructureForRiskAnalysis(structure);
    
    return `Please analyze this workflow for potential risks and bottlenecks with focus on ${goal} optimization:

ORIGINAL WORKFLOW TEXT:
${workflowText}

PARSED STRUCTURE SUMMARY:
- Stages: ${structure.stages.length}
- Dependencies: ${structure.dependencies.length}
- Triggers: ${structure.triggers.length}
- Resources: ${structure.resources.length}

DETAILED STRUCTURE:
${structureInfo}

Please identify specific risks and bottlenecks that could impact workflow execution, reliability, performance, or maintainability. Focus on ${goal} optimization context.`;
  }

  /**
   * Summarize workflow structure for risk analysis
   */
  private summarizeStructureForRiskAnalysis(structure: WorkflowStructure): string {
    let summary = '';
    
    // Stages with risk indicators
    summary += 'STAGES (with risk indicators):\n';
    structure.stages.forEach((stage, index) => {
      summary += `${index + 1}. ${stage.name} (${stage.type})\n`;
      if (stage.configuration?.description) {
        summary += `   Description: ${stage.configuration.description}\n`;
      }
      if (!stage.retryPolicy) {
        summary += `   ⚠️  No retry policy defined\n`;
      }
      if (stage.dependencies && stage.dependencies.length > 0) {
        summary += `   Dependencies: ${stage.dependencies.join(', ')}\n`;
      }
    });
    
    // Dependency analysis
    if (structure.dependencies.length > 0) {
      summary += '\nDEPENDENCY CHAIN ANALYSIS:\n';
      const dependencyMap = new Map<string, string[]>();
      structure.dependencies.forEach(dep => {
        if (!dependencyMap.has(dep.from)) {
          dependencyMap.set(dep.from, []);
        }
        dependencyMap.get(dep.from)!.push(dep.to);
      });
      
      dependencyMap.forEach((targets, source) => {
        summary += `- ${source} → [${targets.join(', ')}]\n`;
      });
    }
    
    // Critical path analysis
    const criticalStages = this.identifyCriticalStages(structure);
    if (criticalStages.length > 0) {
      summary += '\nCRITICAL STAGES (high dependency count):\n';
      criticalStages.forEach(stage => {
        summary += `- ${stage}\n`;
      });
    }
    
    return summary;
  }

  /**
   * Identify stages that are critical based on dependencies
   */
  private identifyCriticalStages(structure: WorkflowStructure): string[] {
    const incomingDeps = new Map<string, number>();
    const outgoingDeps = new Map<string, number>();
    
    structure.dependencies.forEach(dep => {
      incomingDeps.set(dep.to, (incomingDeps.get(dep.to) || 0) + 1);
      outgoingDeps.set(dep.from, (outgoingDeps.get(dep.from) || 0) + 1);
    });
    
    const criticalStages: string[] = [];
    structure.stages.forEach(stage => {
      const incoming = incomingDeps.get(stage.id) || 0;
      const outgoing = outgoingDeps.get(stage.id) || 0;
      
      // Consider critical if it has many dependencies or dependents
      if (incoming > 2 || outgoing > 2) {
        criticalStages.push(stage.id);
      }
    });
    
    return criticalStages;
  }

  /**
   * Convert AI analysis to structured risks and bottlenecks
   */
  private convertAIAnalysisToRisksAndBottlenecks(
    aiAnalysis: AIAnalysisResult, 
    structure: WorkflowStructure
  ): { risks: Risk[], bottlenecks: Bottleneck[] } {
    const risks: Risk[] = [];
    const bottlenecks: Bottleneck[] = [];
    
    aiAnalysis.suggestions.forEach((suggestion, index) => {
      if (suggestion.startsWith('RISK:')) {
        const risk = this.parseRiskSuggestion(suggestion, index);
        if (risk) risks.push(risk);
      } else if (suggestion.startsWith('BOTTLENECK:')) {
        const bottleneck = this.parseBottleneckSuggestion(suggestion, index);
        if (bottleneck) bottlenecks.push(bottleneck);
      } else {
        // Try to infer if it's a risk or bottleneck
        const inferredRisk = this.inferRiskFromSuggestion(suggestion, index);
        if (inferredRisk) risks.push(inferredRisk);
      }
    });
    
    return { risks, bottlenecks };
  }

  /**
   * Parse structured risk suggestion
   */
  private parseRiskSuggestion(suggestion: string, index: number): Risk | null {
    // Format: "RISK: [Risk Type] - [Description] - Severity: [HIGH/MEDIUM/LOW] - Affected: [stage names]"
    const match = suggestion.match(/RISK:\s*(.+?)\s*-\s*(.+?)\s*-\s*Severity:\s*(HIGH|MEDIUM|LOW)\s*-\s*Affected:\s*(.+)/i);
    
    if (!match) return null;
    
    const [, riskTypeStr, description, severityStr, affectedStr] = match;
    
    return {
      type: this.parseRiskType(riskTypeStr),
      severity: this.parseSeverity(severityStr),
      description: description.trim(),
      affectedStages: affectedStr.split(',').map(s => s.trim()),
      mitigation: `AI-suggested mitigation for: ${description.trim()}`
    };
  }

  /**
   * Parse structured bottleneck suggestion
   */
  private parseBottleneckSuggestion(suggestion: string, index: number): Bottleneck | null {
    // Format: "BOTTLENECK: [Bottleneck Type] - [Description] - Impact: [HIGH/MEDIUM/LOW] - Affected: [stage names]"
    const match = suggestion.match(/BOTTLENECK:\s*(.+?)\s*-\s*(.+?)\s*-\s*Impact:\s*(HIGH|MEDIUM|LOW)\s*-\s*Affected:\s*(.+)/i);
    
    if (!match) return null;
    
    const [, bottleneckTypeStr, description, impactStr, affectedStr] = match;
    
    return {
      id: `ai-bottleneck-${index}`,
      type: this.parseBottleneckType(bottleneckTypeStr),
      description: description.trim(),
      affectedStages: affectedStr.split(',').map(s => s.trim()),
      impact: this.parseImpact(impactStr),
      suggestions: [`AI-suggested resolution: ${description.trim()}`]
    };
  }

  /**
   * Infer risk from unstructured suggestion
   */
  private inferRiskFromSuggestion(suggestion: string, index: number): Risk | null {
    const lower = suggestion.toLowerCase();
    
    let riskType = RiskType.SINGLE_POINT_OF_FAILURE;
    let severity = Severity.MEDIUM;
    
    // Infer risk type
    if (lower.includes('retry') || lower.includes('error') || lower.includes('failure')) {
      riskType = RiskType.MISSING_RETRY;
    } else if (lower.includes('scale') || lower.includes('bottleneck') || lower.includes('performance')) {
      riskType = RiskType.SCALING_ISSUE;
    }
    
    // Infer severity
    if (lower.includes('critical') || lower.includes('severe') || lower.includes('high')) {
      severity = Severity.HIGH;
    } else if (lower.includes('low') || lower.includes('minor')) {
      severity = Severity.LOW;
    }
    
    return {
      type: riskType,
      severity,
      description: suggestion,
      affectedStages: ['unknown'],
      mitigation: 'Review and implement appropriate mitigation strategy'
    };
  }

  /**
   * Parse risk type from string
   */
  private parseRiskType(typeStr: string): RiskType {
    const lower = typeStr.toLowerCase();
    
    if (lower.includes('retry') || lower.includes('error')) {
      return RiskType.MISSING_RETRY;
    } else if (lower.includes('scale') || lower.includes('performance')) {
      return RiskType.SCALING_ISSUE;
    } else {
      return RiskType.SINGLE_POINT_OF_FAILURE;
    }
  }

  /**
   * Parse bottleneck type from string
   */
  private parseBottleneckType(typeStr: string): BottleneckType {
    const lower = typeStr.toLowerCase();
    
    if (lower.includes('resource')) {
      return BottleneckType.RESOURCE;
    } else if (lower.includes('dependency')) {
      return BottleneckType.DEPENDENCY;
    } else {
      return BottleneckType.SEQUENTIAL;
    }
  }

  /**
   * Parse severity from string
   */
  private parseSeverity(severityStr: string): Severity {
    switch (severityStr.toUpperCase()) {
      case 'HIGH':
        return Severity.HIGH;
      case 'CRITICAL':
        return Severity.CRITICAL;
      case 'LOW':
        return Severity.LOW;
      default:
        return Severity.MEDIUM;
    }
  }

  /**
   * Parse impact from string
   */
  private parseImpact(impactStr: string): Impact {
    switch (impactStr.toUpperCase()) {
      case 'HIGH':
        return Impact.HIGH;
      case 'LOW':
        return Impact.LOW;
      default:
        return Impact.MEDIUM;
    }
  }
}
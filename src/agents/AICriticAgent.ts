import { AIAgent, AIAnalysisResult } from './AIAgent';
import { WorkflowStructure } from '../types/workflow';
import { Goal } from '../types/goals';
import { 
  CounterArgument, 
  ChallengedAssumption, 
  OverengineeringDetection, 
  AlternativePerspective 
} from './CriticAgent';

export interface AICriticismResult {
  counterArguments: CounterArgument[];
  challengedAssumptions: ChallengedAssumption[];
  overengineeringDetections: OverengineeringDetection[];
  alternativePerspectives: AlternativePerspective[];
  aiAnalysis: AIAnalysisResult;
  confidence: number;
}

export class AICriticAgent extends AIAgent {
  /**
   * Analyze workflow using AI for critical analysis
   */
  async analyzeWorkflow(
    workflowText: string,
    structure: WorkflowStructure,
    goal: Goal,
    context?: { 
      existingRisks?: any[], 
      existingImprovements?: any[],
      existingBottlenecks?: any[]
    }
  ): Promise<AIAnalysisResult> {
    const systemPrompt = this.buildCriticSystemPrompt(goal);
    const userPrompt = this.buildCriticUserPrompt(workflowText, structure, goal, context);
    
    const response = await this.callAI(userPrompt, systemPrompt);
    return this.parseAIResponse(response);
  }

  /**
   * Generate AI-powered critical analysis
   */
  async generateCriticism(
    workflowText: string,
    structure: WorkflowStructure,
    goal: Goal,
    existingAnalysis?: {
      risks?: any[],
      improvements?: any[],
      bottlenecks?: any[]
    }
  ): Promise<AICriticismResult> {
    const aiAnalysis = await this.analyzeWorkflow(workflowText, structure, goal, existingAnalysis);
    const criticism = this.convertAIAnalysisToCriticism(aiAnalysis);
    
    return {
      ...criticism,
      aiAnalysis,
      confidence: aiAnalysis.confidence
    };
  }

  /**
   * Build system prompt for critical analysis
   */
  private buildCriticSystemPrompt(goal: Goal): string {
    return `You are an expert workflow critic and devil's advocate. Your role is to challenge assumptions, identify potential overengineering, and provide alternative perspectives on workflow analysis and recommendations.

CRITICAL ANALYSIS FOCUS: ${goal.toUpperCase()} optimization context
${this.getCriticGoalContext(goal)}

YOUR RESPONSIBILITIES:
1. Challenge existing assumptions about workflow design and analysis
2. Identify potential overengineering and unnecessary complexity
3. Provide counter-arguments to proposed improvements and risk assessments
4. Suggest alternative approaches and perspectives
5. Question whether proposed solutions are proportionate to actual problems
6. Consider the cost-benefit ratio of suggested improvements

RESPONSE FORMAT:
Provide your response as a JSON object with this structure:
{
  "analysis": "Overall critical assessment of the workflow and existing analysis",
  "suggestions": [
    "COUNTER: [Target] - [Counter-argument] - Severity: [HIGH/MEDIUM/LOW]",
    "ASSUMPTION: [Assumption being challenged] - [Alternative view] - [Risk of challenge]",
    "OVERENGINEERING: [Type] - [Description] - [Simplification suggestion]",
    "ALTERNATIVE: [Original approach] - [Alternative approach] - [Context where better]",
    "..."
  ],
  "confidence": 0.85,
  "reasoning": "Explanation of critical analysis approach and reasoning"
}

CRITICISM CATEGORIES:
- COUNTER: Challenge existing risk assessments or improvement suggestions
- ASSUMPTION: Question fundamental assumptions about workflow requirements
- OVERENGINEERING: Identify unnecessarily complex solutions
- ALTERNATIVE: Propose different approaches or perspectives

CRITICAL THINKING PRINCIPLES:
- Question necessity: Is this improvement actually needed?
- Consider proportionality: Does the solution match the problem size?
- Evaluate trade-offs: Are the costs worth the benefits?
- Challenge complexity: Can this be simpler?
- Consider context: Are we solving the right problem?`;
  }

  /**
   * Get goal-specific critic context
   */
  private getCriticGoalContext(goal: Goal): string {
    switch (goal) {
      case Goal.RELIABILITY:
        return `Challenge reliability improvements that may be overkill. Question whether all identified risks are actually significant. Consider if proposed reliability measures introduce unnecessary complexity.`;
      
      case Goal.COST:
        return `Challenge cost optimization suggestions that may have hidden costs. Question whether proposed savings are realistic. Consider if cost-cutting measures compromise other important aspects.`;
      
      case Goal.SIMPLICITY:
        return `Challenge simplification suggestions that may oversimplify. Question whether removing complexity might remove necessary functionality. Consider if simplicity goals conflict with other requirements.`;
      
      default:
        return `Provide balanced critical analysis questioning assumptions across all optimization dimensions.`;
    }
  }

  /**
   * Build user prompt for critical analysis
   */
  private buildCriticUserPrompt(
    workflowText: string, 
    structure: WorkflowStructure, 
    goal: Goal,
    context?: any
  ): string {
    let prompt = `Please provide a critical analysis of this workflow and challenge assumptions about optimization needs:

ORIGINAL WORKFLOW:
${workflowText}

WORKFLOW STRUCTURE:
- Stages: ${structure.stages.length}
- Dependencies: ${structure.dependencies.length}
- Triggers: ${structure.triggers.length}
- Resources: ${structure.resources.length}

OPTIMIZATION GOAL: ${goal}`;

    if (context?.existingRisks?.length > 0) {
      prompt += `\n\nEXISTING RISK ASSESSMENTS TO CHALLENGE:
${context.existingRisks.map((risk: any, i: number) => `${i + 1}. ${risk.description} (${risk.severity})`).join('\n')}`;
    }

    if (context?.existingImprovements?.length > 0) {
      prompt += `\n\nEXISTING IMPROVEMENT SUGGESTIONS TO CHALLENGE:
${context.existingImprovements.map((imp: any, i: number) => `${i + 1}. ${imp.description} (${imp.priority})`).join('\n')}`;
    }

    prompt += `\n\nPlease critically analyze:
1. Are the identified problems actually significant?
2. Are proposed solutions proportionate to the problems?
3. What assumptions might be incorrect?
4. Where might we be overengineering?
5. What alternative approaches could be considered?
6. What are we potentially missing by focusing on ${goal}?`;

    return prompt;
  }

  /**
   * Convert AI analysis to structured criticism
   */
  private convertAIAnalysisToCriticism(aiAnalysis: AIAnalysisResult): {
    counterArguments: CounterArgument[],
    challengedAssumptions: ChallengedAssumption[],
    overengineeringDetections: OverengineeringDetection[],
    alternativePerspectives: AlternativePerspective[]
  } {
    const counterArguments: CounterArgument[] = [];
    const challengedAssumptions: ChallengedAssumption[] = [];
    const overengineeringDetections: OverengineeringDetection[] = [];
    const alternativePerspectives: AlternativePerspective[] = [];

    aiAnalysis.suggestions.forEach((suggestion, index) => {
      if (suggestion.startsWith('COUNTER:')) {
        const counter = this.parseCounterArgument(suggestion, index);
        if (counter) counterArguments.push(counter);
      } else if (suggestion.startsWith('ASSUMPTION:')) {
        const assumption = this.parseChallengedAssumption(suggestion, index);
        if (assumption) challengedAssumptions.push(assumption);
      } else if (suggestion.startsWith('OVERENGINEERING:')) {
        const overeng = this.parseOverengineeringDetection(suggestion, index);
        if (overeng) overengineeringDetections.push(overeng);
      } else if (suggestion.startsWith('ALTERNATIVE:')) {
        const alternative = this.parseAlternativePerspective(suggestion, index);
        if (alternative) alternativePerspectives.push(alternative);
      } else {
        // Try to infer the type
        const inferred = this.inferCriticismType(suggestion, index);
        if (inferred.type === 'counter') counterArguments.push(inferred.item as CounterArgument);
        else if (inferred.type === 'assumption') challengedAssumptions.push(inferred.item as ChallengedAssumption);
        else if (inferred.type === 'overengineering') overengineeringDetections.push(inferred.item as OverengineeringDetection);
        else if (inferred.type === 'alternative') alternativePerspectives.push(inferred.item as AlternativePerspective);
      }
    });

    return {
      counterArguments,
      challengedAssumptions,
      overengineeringDetections,
      alternativePerspectives
    };
  }

  /**
   * Parse counter-argument from AI suggestion
   */
  private parseCounterArgument(suggestion: string, index: number): CounterArgument | null {
    // Format: "COUNTER: [Target] - [Counter-argument] - Severity: [HIGH/MEDIUM/LOW]"
    const match = suggestion.match(/COUNTER:\s*(.+?)\s*-\s*(.+?)\s*-\s*Severity:\s*(HIGH|MEDIUM|LOW)/i);
    
    if (!match) return null;
    
    const [, target, argument, severityStr] = match;
    
    return {
      id: `ai-counter-${index}`,
      targetType: this.inferTargetType(target),
      targetId: target.trim(),
      argument: argument.trim(),
      reasoning: `AI-generated counter-argument: ${argument.trim()}`,
      severity: severityStr.toLowerCase() as 'high' | 'medium' | 'low',
      tradeoffs: this.inferCounterTradeoffs(argument.trim())
    };
  }

  /**
   * Parse challenged assumption from AI suggestion
   */
  private parseChallengedAssumption(suggestion: string, index: number): ChallengedAssumption | null {
    // Format: "ASSUMPTION: [Assumption being challenged] - [Alternative view] - [Risk of challenge]"
    const match = suggestion.match(/ASSUMPTION:\s*(.+?)\s*-\s*(.+?)\s*-\s*(.+)/i);
    
    if (!match) return null;
    
    const [, assumption, alternative, risk] = match;
    
    return {
      id: `ai-assumption-${index}`,
      assumption: assumption.trim(),
      challenge: `AI challenges this assumption: ${alternative.trim()}`,
      alternativeApproach: alternative.trim(),
      riskOfChallenge: risk.trim(),
      benefitOfChallenge: 'Potential for simpler, more appropriate solution'
    };
  }

  /**
   * Parse overengineering detection from AI suggestion
   */
  private parseOverengineeringDetection(suggestion: string, index: number): OverengineeringDetection | null {
    // Format: "OVERENGINEERING: [Type] - [Description] - [Simplification suggestion]"
    const match = suggestion.match(/OVERENGINEERING:\s*(.+?)\s*-\s*(.+?)\s*-\s*(.+)/i);
    
    if (!match) return null;
    
    const [, type, description, simplification] = match;
    
    return {
      id: `ai-overeng-${index}`,
      type: this.parseOverengineeringType(type.trim()),
      description: description.trim(),
      affectedComponents: ['ai-identified'],
      simplificationSuggestion: simplification.trim(),
      potentialDownsides: ['May lose some advanced capabilities', 'Could be less optimal in edge cases']
    };
  }

  /**
   * Parse alternative perspective from AI suggestion
   */
  private parseAlternativePerspective(suggestion: string, index: number): AlternativePerspective | null {
    // Format: "ALTERNATIVE: [Original approach] - [Alternative approach] - [Context where better]"
    const match = suggestion.match(/ALTERNATIVE:\s*(.+?)\s*-\s*(.+?)\s*-\s*(.+)/i);
    
    if (!match) return null;
    
    const [, original, alternative, context] = match;
    
    return {
      id: `ai-alternative-${index}`,
      originalRecommendation: original.trim(),
      alternativeApproach: alternative.trim(),
      pros: ['AI-suggested benefits', 'Potentially simpler approach'],
      cons: ['May not address all requirements', 'Could have different trade-offs'],
      contextWhereBetter: context.trim()
    };
  }

  /**
   * Infer criticism type from unstructured suggestion
   */
  private inferCriticismType(suggestion: string, index: number): { type: string, item: any } {
    const lower = suggestion.toLowerCase();
    
    if (lower.includes('challenge') || lower.includes('question') || lower.includes('assume')) {
      return {
        type: 'assumption',
        item: {
          id: `ai-assumption-${index}`,
          assumption: 'Inferred assumption from AI analysis',
          challenge: suggestion,
          alternativeApproach: 'Consider alternative approaches',
          riskOfChallenge: 'May require different solution approach',
          benefitOfChallenge: 'Potentially simpler or more appropriate solution'
        }
      };
    }
    
    if (lower.includes('complex') || lower.includes('overeng') || lower.includes('unnecessary')) {
      return {
        type: 'overengineering',
        item: {
          id: `ai-overeng-${index}`,
          type: 'unnecessary_complexity' as const,
          description: suggestion,
          affectedComponents: ['ai-identified'],
          simplificationSuggestion: 'Consider simpler alternatives',
          potentialDownsides: ['May lose some functionality']
        }
      };
    }
    
    if (lower.includes('alternative') || lower.includes('instead') || lower.includes('different')) {
      return {
        type: 'alternative',
        item: {
          id: `ai-alternative-${index}`,
          originalRecommendation: 'Current approach',
          alternativeApproach: suggestion,
          pros: ['Different perspective', 'Potentially better fit'],
          cons: ['May have different trade-offs'],
          contextWhereBetter: 'Context-dependent scenarios'
        }
      };
    }
    
    // Default to counter-argument
    return {
      type: 'counter',
      item: {
        id: `ai-counter-${index}`,
        targetType: 'improvement' as const,
        targetId: 'general',
        argument: suggestion,
        reasoning: 'AI-generated critical perspective',
        severity: 'medium' as const,
        tradeoffs: ['Alternative viewpoint to consider']
      }
    };
  }

  /**
   * Helper methods for parsing
   */
  private inferTargetType(target: string): 'risk' | 'improvement' | 'missing_step' | 'bottleneck' {
    const lower = target.toLowerCase();
    if (lower.includes('risk')) return 'risk';
    if (lower.includes('bottleneck')) return 'bottleneck';
    if (lower.includes('missing') || lower.includes('step')) return 'missing_step';
    return 'improvement';
  }

  private inferCounterTradeoffs(argument: string): string[] {
    const tradeoffs = ['Alternative perspective to consider'];
    const lower = argument.toLowerCase();
    
    if (lower.includes('complex')) {
      tradeoffs.push('May avoid unnecessary complexity');
    }
    if (lower.includes('cost')) {
      tradeoffs.push('Potential cost implications to consider');
    }
    if (lower.includes('simple')) {
      tradeoffs.push('May maintain simplicity');
    }
    
    return tradeoffs;
  }

  private parseOverengineeringType(type: string): 'unnecessary_complexity' | 'premature_optimization' | 'over_abstraction' | 'excessive_redundancy' {
    const lower = type.toLowerCase();
    
    if (lower.includes('premature') || lower.includes('optimization')) {
      return 'premature_optimization';
    }
    if (lower.includes('abstraction')) {
      return 'over_abstraction';
    }
    if (lower.includes('redundancy') || lower.includes('redundant')) {
      return 'excessive_redundancy';
    }
    
    return 'unnecessary_complexity';
  }
}
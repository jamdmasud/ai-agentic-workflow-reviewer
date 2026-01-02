import { AIAgent, AIAnalysisResult } from './AIAgent';
import { WorkflowStructure } from '../types/workflow';
import { Goal } from '../types/goals';
import { Improvement, ImprovementType, Priority } from '../types/analysis';

export interface AIOptimizationResult {
  improvements: Improvement[];
  aiAnalysis: AIAnalysisResult;
  confidence: number;
}

export class AIOptimizationAgent extends AIAgent {
  /**
   * Analyze workflow using AI and generate optimization suggestions
   */
  async analyzeWorkflow(
    workflowText: string,
    structure: WorkflowStructure,
    goal: Goal,
    context?: any
  ): Promise<AIAnalysisResult> {
    console.log('AIOptimizationAgent: Starting workflow analysis');
    
    const systemPrompt = this.buildSystemPrompt(goal);
    const userPrompt = this.buildUserPrompt(workflowText, structure, goal);
    
    console.log('AIOptimizationAgent: Built prompts, calling AI...');
    const response = await this.callAI(userPrompt, systemPrompt);
    
    console.log('AIOptimizationAgent: AI call completed, parsing response...');
    const result = this.parseAIResponse(response);
    
    console.log('AIOptimizationAgent: Analysis complete:', {
      hasAnalysis: !!result.analysis,
      suggestionsCount: result.suggestions.length,
      confidence: result.confidence
    });
    
    return result;
  }

  /**
   * Generate AI-powered optimization suggestions
   */
  async generateOptimizations(
    workflowText: string,
    structure: WorkflowStructure,
    goal: Goal
  ): Promise<AIOptimizationResult> {
    console.log('AIOptimizationAgent: Generating optimizations for goal:', goal);
    
    const aiAnalysis = await this.analyzeWorkflow(workflowText, structure, goal);
    console.log('AIOptimizationAgent: AI analysis received:', {
      hasAnalysis: !!aiAnalysis.analysis,
      suggestionsCount: aiAnalysis.suggestions.length
    });
    
    const improvements = this.convertAIAnalysisToImprovements(aiAnalysis, goal);
    console.log('AIOptimizationAgent: Converted to improvements:', improvements.length);
    
    const result = {
      improvements,
      aiAnalysis,
      confidence: aiAnalysis.confidence
    };
    
    console.log('AIOptimizationAgent: Final optimization result:', {
      improvementsCount: result.improvements.length,
      confidence: result.confidence
    });
    
    return result;
  }

  /**
   * Build system prompt for optimization analysis
   */
  private buildSystemPrompt(goal: Goal): string {
    const goalContext = this.getGoalContext(goal);
    
    return `You are an expert workflow optimization analyst. Your task is to analyze workflows and provide specific, actionable optimization recommendations.

OPTIMIZATION GOAL: ${goal.toUpperCase()}
${goalContext}

ANALYSIS REQUIREMENTS:
1. Analyze the workflow for inefficiencies, risks, and improvement opportunities
2. Focus specifically on ${goal} optimization
3. Provide concrete, implementable suggestions
4. Consider trade-offs and implementation complexity
5. Assess confidence level based on workflow clarity and analysis depth

RESPONSE FORMAT:
Provide your response as a JSON object with this structure:
{
  "analysis": "Detailed analysis of the workflow",
  "suggestions": [
    "Specific actionable suggestion 1",
    "Specific actionable suggestion 2",
    "..."
  ],
  "confidence": 0.85,
  "reasoning": "Explanation of your analysis approach and confidence level"
}

FOCUS AREAS:
- Identify bottlenecks and inefficiencies
- Suggest architectural improvements
- Recommend best practices
- Consider scalability and maintainability
- Evaluate resource utilization
- Assess error handling and resilience`;
  }

  /**
   * Build user prompt with workflow details
   */
  private buildUserPrompt(workflowText: string, structure: WorkflowStructure, goal: Goal): string {
    const structureInfo = this.summarizeStructure(structure);
    
    return `Please analyze this workflow for ${goal} optimization:

ORIGINAL WORKFLOW TEXT:
${workflowText}

PARSED STRUCTURE SUMMARY:
- Stages: ${structure.stages.length}
- Dependencies: ${structure.dependencies.length}
- Triggers: ${structure.triggers.length}
- Resources: ${structure.resources.length}

DETAILED STRUCTURE:
${structureInfo}

Please provide a comprehensive analysis focusing on ${goal} optimization with specific, actionable recommendations.`;
  }

  /**
   * Get goal-specific context
   */
  private getGoalContext(goal: Goal): string {
    switch (goal) {
      case Goal.RELIABILITY:
        return `Focus on fault tolerance, error handling, redundancy, monitoring, and resilience. 
        Prioritize suggestions that reduce failure probability and improve recovery capabilities.`;
      
      case Goal.COST:
        return `Focus on resource efficiency, cost reduction, scaling optimization, and waste elimination.
        Prioritize suggestions that reduce operational costs while maintaining functionality.`;
      
      case Goal.SIMPLICITY:
        return `Focus on architectural simplification, maintainability, and reducing complexity.
        Prioritize suggestions that make the workflow easier to understand, modify, and maintain.`;
      
      default:
        return `Provide balanced optimization recommendations across reliability, cost, and simplicity.`;
    }
  }

  /**
   * Summarize workflow structure for AI analysis
   */
  private summarizeStructure(structure: WorkflowStructure): string {
    let summary = '';
    
    // Stages summary
    summary += 'STAGES:\n';
    structure.stages.forEach((stage, index) => {
      summary += `${index + 1}. ${stage.name} (${stage.type})\n`;
      if (stage.configuration?.description) {
        summary += `   Description: ${stage.configuration.description}\n`;
      }
    });
    
    // Dependencies summary
    if (structure.dependencies.length > 0) {
      summary += '\nDEPENDENCIES:\n';
      structure.dependencies.forEach(dep => {
        summary += `- ${dep.from} → ${dep.to} (${dep.type})\n`;
      });
    }
    
    // Triggers summary
    if (structure.triggers.length > 0) {
      summary += '\nTRIGGERS:\n';
      structure.triggers.forEach(trigger => {
        summary += `- ${trigger.id}: ${trigger.type} - ${trigger.condition}\n`;
      });
    }
    
    return summary;
  }

  /**
   * Convert AI analysis to structured improvements
   */
  private convertAIAnalysisToImprovements(aiAnalysis: AIAnalysisResult, goal: Goal): Improvement[] {
    console.log('AIOptimizationAgent: Converting AI analysis to improvements:', {
      suggestionsCount: aiAnalysis.suggestions.length,
      analysisLength: aiAnalysis.analysis.length,
      goal
    });

    const improvements: Improvement[] = [];
    
    aiAnalysis.suggestions.forEach((suggestion, index) => {
      console.log(`AIOptimizationAgent: Processing suggestion ${index + 1}:`, suggestion.substring(0, 100));
      
      const improvement: Improvement = {
        type: this.inferImprovementType(suggestion, goal),
        priority: this.inferPriority(suggestion, aiAnalysis.confidence),
        description: suggestion,
        implementation: `AI-suggested implementation: ${suggestion}`,
        tradeoffs: this.inferTradeoffs(suggestion, goal),
        goalAlignment: this.calculateGoalAlignment(suggestion, goal)
      };
      
      improvements.push(improvement);
    });
    
    console.log('AIOptimizationAgent: Converted improvements:', {
      count: improvements.length,
      types: improvements.map(i => i.type),
      priorities: improvements.map(i => i.priority)
    });
    
    return improvements;
  }

  /**
   * Infer improvement type from suggestion text
   */
  private inferImprovementType(suggestion: string, goal: Goal): ImprovementType {
    const lower = suggestion.toLowerCase();
    
    if (lower.includes('reliability') || lower.includes('fault') || lower.includes('error') || 
        lower.includes('retry') || lower.includes('redundancy') || lower.includes('monitoring')) {
      return ImprovementType.RELIABILITY;
    }
    
    if (lower.includes('cost') || lower.includes('resource') || lower.includes('efficiency') || 
        lower.includes('scaling') || lower.includes('optimize')) {
      return ImprovementType.COST;
    }
    
    if (lower.includes('performance') || lower.includes('speed') || lower.includes('parallel') || 
        lower.includes('cache') || lower.includes('throughput')) {
      return ImprovementType.PERFORMANCE;
    }
    
    if (lower.includes('maintain') || lower.includes('document') || lower.includes('simple') || 
        lower.includes('clean') || lower.includes('standard')) {
      return ImprovementType.MAINTAINABILITY;
    }
    
    // Default based on goal
    switch (goal) {
      case Goal.RELIABILITY:
        return ImprovementType.RELIABILITY;
      case Goal.COST:
        return ImprovementType.COST;
      case Goal.SIMPLICITY:
        return ImprovementType.MAINTAINABILITY;
      default:
        return ImprovementType.ARCHITECTURE;
    }
  }

  /**
   * Infer priority from suggestion and confidence
   */
  private inferPriority(suggestion: string, confidence: number): Priority {
    const lower = suggestion.toLowerCase();
    
    // High priority indicators
    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('must') || 
        lower.includes('essential') || lower.includes('immediately')) {
      return Priority.HIGH;
    }
    
    // Low priority indicators
    if (lower.includes('consider') || lower.includes('might') || lower.includes('optional') || 
        lower.includes('nice to have') || lower.includes('future')) {
      return Priority.LOW;
    }
    
    // Use confidence to determine priority
    if (confidence > 0.8) {
      return Priority.HIGH;
    } else if (confidence > 0.6) {
      return Priority.MEDIUM;
    } else {
      return Priority.LOW;
    }
  }

  /**
   * Infer tradeoffs from suggestion
   */
  private inferTradeoffs(suggestion: string, goal: Goal): string[] {
    const tradeoffs: string[] = [];
    const lower = suggestion.toLowerCase();
    
    // Common tradeoff patterns
    if (lower.includes('complex') || lower.includes('sophisticated')) {
      tradeoffs.push('Increased implementation complexity');
    }
    
    if (lower.includes('resource') || lower.includes('memory') || lower.includes('cpu')) {
      tradeoffs.push('Additional resource requirements');
    }
    
    if (lower.includes('time') || lower.includes('delay') || lower.includes('latency')) {
      tradeoffs.push('Potential impact on execution time');
    }
    
    if (lower.includes('maintain') || lower.includes('manage')) {
      tradeoffs.push('Additional maintenance overhead');
    }
    
    // Add goal-specific benefits
    switch (goal) {
      case Goal.RELIABILITY:
        tradeoffs.push('Improved system reliability and fault tolerance');
        break;
      case Goal.COST:
        tradeoffs.push('Potential cost savings and resource optimization');
        break;
      case Goal.SIMPLICITY:
        tradeoffs.push('Simplified architecture and easier maintenance');
        break;
    }
    
    return tradeoffs.length > 0 ? tradeoffs : ['Implementation effort required', 'Potential system improvements'];
  }

  /**
   * Calculate goal alignment score
   */
  private calculateGoalAlignment(suggestion: string, goal: Goal): number {
    const lower = suggestion.toLowerCase();
    let alignment = 0.5; // Base alignment
    
    const goalKeywords = {
      [Goal.RELIABILITY]: ['reliability', 'fault', 'error', 'retry', 'redundancy', 'monitoring', 'resilience'],
      [Goal.COST]: ['cost', 'resource', 'efficiency', 'scaling', 'optimize', 'waste', 'budget'],
      [Goal.SIMPLICITY]: ['simple', 'maintain', 'clean', 'standard', 'document', 'understand', 'complexity']
    };
    
    const keywords = goalKeywords[goal] || [];
    const matchCount = keywords.filter(keyword => lower.includes(keyword)).length;
    
    // Increase alignment based on keyword matches
    alignment += (matchCount / keywords.length) * 0.5;
    
    return Math.min(1.0, alignment);
  }
}
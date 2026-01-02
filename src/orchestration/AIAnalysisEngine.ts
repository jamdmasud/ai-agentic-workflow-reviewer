import { WorkflowStructure } from '../types/workflow';
import { AnalysisResults } from '../types/analysis';
import { Goal } from '../types/goals';
import { ParserAgent } from '../agents/ParserAgent';
import { AIOptimizationAgent, AIOptimizationResult } from '../agents/AIOptimizationAgent';
import { AIRiskAnalyzerAgent, AIRiskAnalysisResult } from '../agents/AIRiskAnalyzerAgent';
import { AICriticAgent, AICriticismResult } from '../agents/AICriticAgent';
import { AIAgentConfig } from '../agents/AIAgent';
import { ResultCache } from './ResultCache';
import { NetworkErrorHandler } from '../utils/NetworkErrorHandler';

export interface AIAnalysisEngineResult {
  success: boolean;
  data?: AnalysisResults & {
    aiInsights?: {
      optimizationAnalysis?: string;
      riskAnalysis?: string;
      criticismAnalysis?: string;
      overallConfidence?: number;
    };
  };
  error?: string;
  guidance?: string;
  partialResults?: Partial<AnalysisResults>;
  executedAgents: string[];
  failedAgents: string[];
  fromCache?: boolean;
  cacheHitComponents?: string[];
  performanceGain?: number;
}

export interface AIAgentExecutionStatus {
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  aiProvider?: string;
  tokensUsed?: number;
}

export class AIAnalysisEngine {
  private parserAgent: ParserAgent;
  private aiOptimizationAgent: AIOptimizationAgent;
  private aiRiskAnalyzerAgent: AIRiskAnalyzerAgent;
  private aiCriticAgent: AICriticAgent;
  private resultCache: ResultCache;
  private aiConfig: AIAgentConfig;

  constructor(aiConfig: AIAgentConfig, resultCache?: ResultCache) {
    this.aiConfig = aiConfig;
    this.parserAgent = new ParserAgent();
    this.aiOptimizationAgent = new AIOptimizationAgent(aiConfig);
    this.aiRiskAnalyzerAgent = new AIRiskAnalyzerAgent(aiConfig);
    this.aiCriticAgent = new AICriticAgent(aiConfig);
    this.resultCache = resultCache || new ResultCache();
  }

  /**
   * Main AI-powered analysis method
   */
  async analyzeWorkflow(workflowText: string, goal: Goal): Promise<AIAnalysisEngineResult> {
    const startTime = Date.now();
    const executedAgents: string[] = [];
    const failedAgents: string[] = [];
    const cacheHitComponents: string[] = [];
    
    const agentStatuses: AIAgentExecutionStatus[] = [
      { agentName: 'ParserAgent', status: 'pending' },
      { agentName: 'AIOptimizationAgent', status: 'pending', aiProvider: this.aiConfig.provider },
      { agentName: 'AIRiskAnalyzerAgent', status: 'pending', aiProvider: this.aiConfig.provider },
      { agentName: 'AICriticAgent', status: 'pending', aiProvider: this.aiConfig.provider }
    ];

    // Validate AI configuration
    const configValidation = this.validateAIConfig();
    if (!configValidation.valid) {
      return {
        success: false,
        error: configValidation.error,
        guidance: configValidation.guidance,
        executedAgents: [],
        failedAgents: ['AIConfiguration']
      };
    }

    // Check network connectivity for AI providers
    const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    if (!isTestEnvironment && this.aiConfig.provider !== 'local') {
      const isConnected = await NetworkErrorHandler.checkConnectivity();
      if (!isConnected) {
        return {
          success: false,
          error: 'Network connectivity issue detected. AI analysis requires internet connection.',
          guidance: 'Please check your internet connection and try again, or configure a local AI model.',
          executedAgents: [],
          failedAgents: ['NetworkConnectivity']
        };
      }
    }

    // Check for complete cached results first
    const cachedResults = this.resultCache.getCachedResults(workflowText, goal);
    if (cachedResults) {
      return {
        success: true,
        data: cachedResults,
        executedAgents: ['Cache'],
        failedAgents: [],
        fromCache: true,
        cacheHitComponents: ['complete_ai_analysis'],
        performanceGain: 95
      };
    }

    let workflowStructure: WorkflowStructure;
    let aiOptimizationResult: AIOptimizationResult;
    let aiRiskAnalysisResult: AIRiskAnalysisResult;
    let aiCriticismResult: AICriticismResult;

    try {
      // Step 1: Parse workflow (reuse existing parser)
      const parseResult = await this.executeAgent(
        'ParserAgent',
        () => this.parserAgent.parse(workflowText),
        agentStatuses
      );

      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          error: parseResult.error || 'Failed to parse workflow',
          guidance: 'Please ensure your workflow is in a valid format (JSON, YAML, or structured text)',
          executedAgents,
          failedAgents: ['ParserAgent']
        };
      }

      workflowStructure = parseResult.data;
      executedAgents.push('ParserAgent');

      // Step 2: AI-powered optimization analysis
      try {
        console.log('AIAnalysisEngine: Starting optimization agent...');
        aiOptimizationResult = await this.executeAIAgent(
          'AIOptimizationAgent',
          () => this.aiOptimizationAgent.generateOptimizations(workflowText, workflowStructure, goal),
          agentStatuses
        );
        console.log('AIAnalysisEngine: Optimization agent completed:', {
          improvementsCount: aiOptimizationResult.improvements.length,
          confidence: aiOptimizationResult.confidence,
          hasAiAnalysis: !!aiOptimizationResult.aiAnalysis
        });
        executedAgents.push('AIOptimizationAgent');
      } catch (error) {
        failedAgents.push('AIOptimizationAgent');
        console.error('AI Optimization Agent failed:', error);
        // Create fallback result
        aiOptimizationResult = {
          improvements: [],
          aiAnalysis: {
            analysis: 'AI optimization analysis failed',
            suggestions: [],
            confidence: 0.1,
            reasoning: 'AI service unavailable'
          },
          confidence: 0.1
        };
      }

      // Step 3: AI-powered risk analysis
      try {
        aiRiskAnalysisResult = await this.executeAIAgent(
          'AIRiskAnalyzerAgent',
          () => this.aiRiskAnalyzerAgent.analyzeRisks(workflowText, workflowStructure, goal),
          agentStatuses
        );
        executedAgents.push('AIRiskAnalyzerAgent');
      } catch (error) {
        failedAgents.push('AIRiskAnalyzerAgent');
        console.error('AI Risk Analyzer Agent failed:', error);
        // Create fallback result
        aiRiskAnalysisResult = {
          risks: [],
          bottlenecks: [],
          aiAnalysis: {
            analysis: 'AI risk analysis failed',
            suggestions: [],
            confidence: 0.1,
            reasoning: 'AI service unavailable'
          },
          confidence: 0.1
        };
      }

      // Step 4: AI-powered critical analysis
      try {
        aiCriticismResult = await this.executeAIAgent(
          'AICriticAgent',
          () => this.aiCriticAgent.generateCriticism(
            workflowText, 
            workflowStructure, 
            goal,
            {
              risks: aiRiskAnalysisResult.risks,
              improvements: aiOptimizationResult.improvements,
              bottlenecks: aiRiskAnalysisResult.bottlenecks
            }
          ),
          agentStatuses
        );
        executedAgents.push('AICriticAgent');
      } catch (error) {
        failedAgents.push('AICriticAgent');
        console.error('AI Critic Agent failed:', error);
        // Create fallback result
        aiCriticismResult = {
          counterArguments: [],
          challengedAssumptions: [],
          overengineeringDetections: [],
          alternativePerspectives: [],
          aiAnalysis: {
            analysis: 'AI criticism analysis failed',
            suggestions: [],
            confidence: 0.1,
            reasoning: 'AI service unavailable'
          },
          confidence: 0.1
        };
      }

      // Aggregate results with AI insights
      console.log('AIAnalysisEngine: Aggregating results from all agents...');
      const analysisResults: AnalysisResults & {
        aiInsights?: {
          optimizationAnalysis?: string;
          riskAnalysis?: string;
          criticismAnalysis?: string;
          overallConfidence?: number;
        };
      } = {
        risks: aiRiskAnalysisResult.risks,
        bottlenecks: aiRiskAnalysisResult.bottlenecks,
        missingSteps: [], // Could be extracted from AI suggestions
        improvements: aiOptimizationResult.improvements,
        refinedWorkflow: workflowStructure, // Could be enhanced by AI
        confidence: this.calculateOverallConfidence(
          aiOptimizationResult.confidence,
          aiRiskAnalysisResult.confidence,
          aiCriticismResult.confidence,
          failedAgents.length
        ),
        // Add AI insights
        aiInsights: {
          optimizationAnalysis: aiOptimizationResult.aiAnalysis.analysis,
          riskAnalysis: aiRiskAnalysisResult.aiAnalysis.analysis,
          criticismAnalysis: aiCriticismResult.aiAnalysis.analysis,
          overallConfidence: this.calculateAIConfidence(
            aiOptimizationResult.aiAnalysis.confidence,
            aiRiskAnalysisResult.aiAnalysis.confidence,
            aiCriticismResult.aiAnalysis.confidence
          )
        }
      };

      console.log('AIAnalysisEngine: Final aggregated results:', {
        risksCount: analysisResults.risks.length,
        bottlenecksCount: analysisResults.bottlenecks.length,
        improvementsCount: analysisResults.improvements.length,
        confidence: analysisResults.confidence,
        hasAiInsights: !!analysisResults.aiInsights,
        optimizationAnalysisLength: analysisResults.aiInsights?.optimizationAnalysis?.length || 0
      });

      // Add criticism data to results
      (analysisResults as any).counterArguments = aiCriticismResult.counterArguments;
      (analysisResults as any).challengedAssumptions = aiCriticismResult.challengedAssumptions;
      (analysisResults as any).overengineeringDetections = aiCriticismResult.overengineeringDetections;
      (analysisResults as any).alternativePerspectives = aiCriticismResult.alternativePerspectives;

      // Cache the results
      this.resultCache.storeFinalResults(workflowText, goal, analysisResults);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log('AIAnalysisEngine: Analysis complete, returning results:', {
        success: failedAgents.length < 3,
        executedAgents,
        failedAgents,
        totalTime: totalTime + 'ms'
      });

      return {
        success: failedAgents.length < 3, // Allow some failures
        data: analysisResults,
        executedAgents,
        failedAgents,
        fromCache: false,
        performanceGain: 0,
        ...(failedAgents.length > 0 && {
          partialResults: analysisResults,
          error: `AI analysis completed with ${failedAgents.length} agent failures: ${failedAgents.join(', ')}`,
          guidance: failedAgents.length > 2 
            ? 'Multiple AI agents failed. Please check your AI configuration and network connection.'
            : 'Some AI agents failed but analysis was completed with available results.'
        })
      };

    } catch (error) {
      console.error('AI Analysis Engine critical failure:', error);
      
      return {
        success: false,
        error: `AI analysis engine failure: ${error instanceof Error ? error.message : 'Unknown error'}`,
        guidance: 'Please check your AI configuration, network connection, and try again.',
        executedAgents,
        failedAgents: ['AIAnalysisEngine']
      };
    }
  }

  /**
   * Execute a regular agent with error handling
   */
  private async executeAgent<T>(
    agentName: string,
    agentFunction: () => Promise<T>,
    statuses: AIAgentExecutionStatus[]
  ): Promise<T> {
    const status = statuses.find(s => s.agentName === agentName);
    if (status) {
      status.status = 'running';
      status.startTime = new Date();
    }

    try {
      const result = await agentFunction();
      
      if (status) {
        status.status = 'completed';
        status.endTime = new Date();
      }
      
      return result;
    } catch (error) {
      if (status) {
        status.status = 'failed';
        status.endTime = new Date();
        status.error = error instanceof Error ? error.message : 'Unknown error';
      }
      throw error;
    }
  }

  /**
   * Execute an AI agent with enhanced error handling and retry logic
   */
  private async executeAIAgent<T>(
    agentName: string,
    agentFunction: () => Promise<T>,
    statuses: AIAgentExecutionStatus[]
  ): Promise<T> {
    const status = statuses.find(s => s.agentName === agentName);
    if (status) {
      status.status = 'running';
      status.startTime = new Date();
    }

    try {
      // Execute with AI-specific retry logic
      const result = await NetworkErrorHandler.withRetry(
        agentFunction,
        {
          maxAttempts: 2, // Fewer retries for AI calls due to cost
          baseDelayMs: 2000,
          maxDelayMs: 10000,
          backoffMultiplier: 2
        }
      );
      
      if (status) {
        status.status = 'completed';
        status.endTime = new Date();
        // Could track token usage here if available from AI response
      }
      
      return result;
    } catch (error) {
      if (status) {
        status.status = 'failed';
        status.endTime = new Date();
        status.error = this.getAIErrorMessage(error);
      }
      throw error;
    }
  }

  /**
   * Get user-friendly AI error message
   */
  private getAIErrorMessage(error: any): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('api key') || message.includes('unauthorized')) {
        return 'AI API key not configured or invalid';
      }
      if (message.includes('quota') || message.includes('limit')) {
        return 'AI API quota exceeded or rate limited';
      }
      if (message.includes('network') || message.includes('connection')) {
        return 'Network connection to AI service failed';
      }
      if (message.includes('timeout')) {
        return 'AI service request timed out';
      }
      
      return error.message;
    }
    
    return 'Unknown AI service error';
  }

  /**
   * Validate AI configuration
   */
  private validateAIConfig(): { valid: boolean; error?: string; guidance?: string } {
    if (!this.aiConfig.provider) {
      return {
        valid: false,
        error: 'AI provider not configured',
        guidance: 'Please configure an AI provider (openai, anthropic, or local) in your settings'
      };
    }

    if (this.aiConfig.provider !== 'local' && !this.aiConfig.apiKey) {
      return {
        valid: false,
        error: `API key required for ${this.aiConfig.provider}`,
        guidance: `Please configure your ${this.aiConfig.provider.toUpperCase()} API key in the settings`
      };
    }

    if (this.aiConfig.provider === 'local' && !this.aiConfig.baseUrl) {
      return {
        valid: false,
        error: 'Base URL required for local AI provider',
        guidance: 'Please configure the base URL for your local AI service (e.g., http://localhost:11434 for Ollama)'
      };
    }

    return { valid: true };
  }

  /**
   * Calculate overall confidence from AI agents
   */
  private calculateOverallConfidence(
    optimizationConfidence: number,
    riskConfidence: number,
    criticismConfidence: number,
    failedAgentCount: number
  ): number {
    const confidences = [optimizationConfidence, riskConfidence, criticismConfidence];
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

    // Reduce confidence based on failed agents
    const failurePenalty = failedAgentCount * 0.25; // Higher penalty for AI failures
    
    return Math.max(0.1, Math.min(1.0, avgConfidence - failurePenalty));
  }

  /**
   * Calculate AI-specific confidence
   */
  private calculateAIConfidence(
    optimizationConfidence: number,
    riskConfidence: number,
    criticismConfidence: number
  ): number {
    return (optimizationConfidence + riskConfidence + criticismConfidence) / 3;
  }

  /**
   * Get current status of all agents
   */
  getAgentStatuses(): AIAgentExecutionStatus[] {
    return [
      { agentName: 'ParserAgent', status: 'pending' },
      { agentName: 'AIOptimizationAgent', status: 'pending', aiProvider: this.aiConfig.provider },
      { agentName: 'AIRiskAnalyzerAgent', status: 'pending', aiProvider: this.aiConfig.provider },
      { agentName: 'AICriticAgent', status: 'pending', aiProvider: this.aiConfig.provider }
    ];
  }

  /**
   * Update AI configuration
   */
  updateAIConfig(newConfig: Partial<AIAgentConfig>): void {
    this.aiConfig = { ...this.aiConfig, ...newConfig };
    
    // Update agent configurations
    this.aiOptimizationAgent = new AIOptimizationAgent(this.aiConfig);
    this.aiRiskAnalyzerAgent = new AIRiskAnalyzerAgent(this.aiConfig);
    this.aiCriticAgent = new AICriticAgent(this.aiConfig);
  }

  /**
   * Get AI configuration (without sensitive data)
   */
  getAIConfig(): Omit<AIAgentConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.aiConfig;
    return safeConfig;
  }

  /**
   * Test AI connectivity
   */
  async testAIConnectivity(): Promise<{ success: boolean; error?: string; provider?: string }> {
    try {
      const testResult = await this.aiOptimizationAgent.analyzeWorkflow(
        'Test workflow: Step 1: Test step',
        {
          stages: [{ id: 'test', name: 'Test', type: 'task' as any, configuration: {}, dependencies: [] }],
          dependencies: [],
          triggers: [],
          resources: [],
          metadata: { name: 'Test', version: '1.0.0', created: new Date(), modified: new Date() }
        },
        Goal.SIMPLICITY
      );

      return {
        success: true,
        provider: this.aiConfig.provider
      };
    } catch (error) {
      return {
        success: false,
        error: this.getAIErrorMessage(error),
        provider: this.aiConfig.provider
      };
    }
  }
}
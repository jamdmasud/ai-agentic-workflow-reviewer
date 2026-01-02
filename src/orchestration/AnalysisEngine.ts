import { WorkflowStructure } from '../types/workflow';
import { AnalysisResults } from '../types/analysis';
import { Goal } from '../types/goals';
import { ParserAgent } from '../agents/ParserAgent';
import { RiskAnalyzerAgent, RiskAnalysis } from '../agents/RiskAnalyzerAgent';
import { OptimizationAgent, OptimizationSuggestions } from '../agents/OptimizationAgent';
import { CriticAgent, CriticismReport } from '../agents/CriticAgent';
import { ResultCache } from './ResultCache';
import { NetworkErrorHandler, NetworkError } from '../utils/NetworkErrorHandler';

export interface AnalysisEngineResult {
  success: boolean;
  data?: AnalysisResults;
  error?: string;
  guidance?: string;
  partialResults?: Partial<AnalysisResults>;
  executedAgents: string[];
  failedAgents: string[];
  fromCache?: boolean;
  cacheHitComponents?: string[];
  performanceGain?: number;
}

export interface AgentExecutionStatus {
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export class AnalysisEngine {
  private parserAgent: ParserAgent;
  private riskAnalyzerAgent: RiskAnalyzerAgent;
  private optimizationAgent: OptimizationAgent;
  private criticAgent: CriticAgent;
  private resultCache: ResultCache;

  constructor(resultCache?: ResultCache) {
    this.parserAgent = new ParserAgent();
    this.riskAnalyzerAgent = new RiskAnalyzerAgent();
    this.optimizationAgent = new OptimizationAgent();
    this.criticAgent = new CriticAgent();
    this.resultCache = resultCache || new ResultCache();
  }

  /**
   * Main analysis method that orchestrates all agents in sequence with caching optimization
   */
  async analyzeWorkflow(workflowText: string, goal: Goal): Promise<AnalysisEngineResult> {
    const startTime = Date.now();
    const executedAgents: string[] = [];
    const failedAgents: string[] = [];
    const cacheHitComponents: string[] = [];
    
    const agentStatuses: AgentExecutionStatus[] = [
      { agentName: 'ParserAgent', status: 'pending' },
      { agentName: 'RiskAnalyzerAgent', status: 'pending' },
      { agentName: 'OptimizationAgent', status: 'pending' },
      { agentName: 'CriticAgent', status: 'pending' }
    ];

    // Check network connectivity before starting analysis (skip in test environment)
    const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    if (!isTestEnvironment) {
      const isConnected = await NetworkErrorHandler.checkConnectivity();
      if (!isConnected) {
        return {
          success: false,
          error: 'Network connectivity issue detected. Please check your internet connection and try again.',
          executedAgents: [],
          failedAgents: ['NetworkConnectivity']
        };
      }
    }

    // Check for complete cached results first
    const cachedResults = this.resultCache.getCachedResults(workflowText, goal);
    if (cachedResults) {
      const endTime = Date.now();
      return {
        success: true,
        data: cachedResults,
        executedAgents: ['Cache'],
        failedAgents: [],
        fromCache: true,
        cacheHitComponents: ['complete_analysis'],
        performanceGain: 95 // Nearly instant from cache
      };
    }

    let workflowStructure: WorkflowStructure;
    let riskAnalysis: RiskAnalysis;
    let optimizationSuggestions: OptimizationSuggestions;
    let criticismReport: CriticismReport;

    try {
      // Step 1: Parse workflow (check cache first)
      let cachedParseResult = this.resultCache.getCachedParseResult(workflowText, goal);
      
      // If not cached for this goal, check if we can reuse from another goal
      if (!cachedParseResult) {
        const reuseInfo = this.resultCache.canReuseParsedWorkflow(workflowText);
        if (reuseInfo.canReuse && reuseInfo.parseResult) {
          cachedParseResult = reuseInfo.parseResult;
          // Store for current goal to speed up future requests
          this.resultCache.storeParsedWorkflow(workflowText, goal, cachedParseResult);
        }
      }

      if (cachedParseResult && cachedParseResult.success && cachedParseResult.data) {
        workflowStructure = cachedParseResult.data;
        cacheHitComponents.push('parsing');
      } else {
        const parseResult = await this.executeAgent(
          'ParserAgent',
          () => this.parserAgent.parse(workflowText),
          agentStatuses
        );

        if (!parseResult.success || !parseResult.data) {
          return {
            success: false,
            error: parseResult.error || 'Failed to parse workflow',
            executedAgents,
            failedAgents: ['ParserAgent']
          };
        }

        workflowStructure = parseResult.data;
        // Cache the parse result for future use
        this.resultCache.storeParsedWorkflow(workflowText, goal, parseResult);
        executedAgents.push('ParserAgent');
      }

      // Step 2: Analyze risks (check cache)
      const cachedRiskAnalysis = this.resultCache.getCachedRiskAnalysis(workflowText, goal);
      if (cachedRiskAnalysis) {
        riskAnalysis = cachedRiskAnalysis;
        cacheHitComponents.push('risk_analysis');
      } else {
        try {
          riskAnalysis = await this.executeAgent(
            'RiskAnalyzerAgent',
            () => this.riskAnalyzerAgent.analyzeRisks(workflowStructure, goal),
            agentStatuses
          );
          this.resultCache.storeRiskAnalysis(workflowText, goal, riskAnalysis);
          executedAgents.push('RiskAnalyzerAgent');
        } catch (error) {
          failedAgents.push('RiskAnalyzerAgent');
          // Create minimal risk analysis to allow continuation
          riskAnalysis = {
            risks: [],
            bottlenecks: [],
            confidence: 0.1
          };
        }
      }

      // Step 3: Generate optimizations (check cache)
      const cachedOptimizationSuggestions = this.resultCache.getCachedOptimizationSuggestions(workflowText, goal);
      if (cachedOptimizationSuggestions) {
        optimizationSuggestions = cachedOptimizationSuggestions;
        cacheHitComponents.push('optimization');
      } else {
        try {
          optimizationSuggestions = await this.executeAgent(
            'OptimizationAgent',
            () => this.optimizationAgent.optimize(workflowStructure, riskAnalysis, goal),
            agentStatuses
          );
          this.resultCache.storeOptimizationSuggestions(workflowText, goal, optimizationSuggestions);
          executedAgents.push('OptimizationAgent');
        } catch (error) {
          failedAgents.push('OptimizationAgent');
          // Create minimal optimization suggestions to allow continuation
          optimizationSuggestions = {
            improvements: [],
            missingSteps: [],
            refinedWorkflow: workflowStructure,
            confidence: 0.1
          };
        }
      }

      // Step 4: Generate criticism (check cache)
      const cachedCriticismReport = this.resultCache.getCachedCriticismReport(workflowText, goal);
      if (cachedCriticismReport) {
        criticismReport = cachedCriticismReport;
        cacheHitComponents.push('criticism');
      } else {
        try {
          criticismReport = await this.executeAgent(
            'CriticAgent',
            () => this.criticAgent.critique(workflowStructure, riskAnalysis, optimizationSuggestions, goal),
            agentStatuses
          );
          this.resultCache.storeCriticismReport(workflowText, goal, criticismReport);
          executedAgents.push('CriticAgent');
        } catch (error) {
          failedAgents.push('CriticAgent');
          // Create minimal criticism report
          criticismReport = {
            counterArguments: [],
            challengedAssumptions: [],
            overengineeringDetections: [],
            alternativePerspectives: [],
            confidence: 0.1
          };
        }
      }

      // Aggregate results
      const analysisResults: AnalysisResults = {
        risks: riskAnalysis.risks,
        bottlenecks: riskAnalysis.bottlenecks,
        missingSteps: optimizationSuggestions.missingSteps,
        improvements: optimizationSuggestions.improvements,
        refinedWorkflow: optimizationSuggestions.refinedWorkflow,
        confidence: this.calculateOverallConfidence(
          riskAnalysis.confidence,
          optimizationSuggestions.confidence,
          criticismReport.confidence,
          failedAgents.length
        )
      };

      // Add criticism data to results (extend the interface if needed)
      (analysisResults as any).counterArguments = criticismReport.counterArguments;
      (analysisResults as any).challengedAssumptions = criticismReport.challengedAssumptions;
      (analysisResults as any).overengineeringDetections = criticismReport.overengineeringDetections;
      (analysisResults as any).alternativePerspectives = criticismReport.alternativePerspectives;

      // Cache the final results
      this.resultCache.storeFinalResults(workflowText, goal, analysisResults);

      // Calculate performance gain
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const performanceGain = this.calculatePerformanceGain(cacheHitComponents, totalTime);

      return {
        success: failedAgents.length === 0,
        data: analysisResults,
        executedAgents: cacheHitComponents.length > 0 ? [...executedAgents, 'Cache'] : executedAgents,
        failedAgents,
        fromCache: cacheHitComponents.length > 0,
        cacheHitComponents,
        performanceGain,
        ...(failedAgents.length > 0 && {
          partialResults: analysisResults,
          error: `Analysis completed with ${failedAgents.length} agent failures: ${failedAgents.join(', ')}`
        })
      };

    } catch (error) {
      // Handle system-level errors with user-friendly messages
      let errorMessage = 'Critical analysis engine failure';
      
      if (error instanceof Error && (error as NetworkError).isRetryable !== undefined) {
        const networkError = error as NetworkError;
        errorMessage = NetworkErrorHandler.getUserFriendlyMessage(networkError);
      } else if (error instanceof Error) {
        errorMessage = `Critical analysis engine failure: ${error.message}`;
      }

      return {
        success: false,
        error: errorMessage,
        executedAgents,
        failedAgents: ['AnalysisEngine']
      };
    }
  }

  /**
   * Execute a single agent with error handling, retry logic, and status tracking
   */
  private async executeAgent<T>(
    agentName: string,
    agentFunction: () => Promise<T>,
    statuses: AgentExecutionStatus[]
  ): Promise<T> {
    const status = statuses.find(s => s.agentName === agentName);
    if (status) {
      status.status = 'running';
      status.startTime = new Date();
    }

    try {
      // Execute with network error handling and retry logic
      const result = await NetworkErrorHandler.withRetry(
        agentFunction,
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          maxDelayMs: 5000,
          backoffMultiplier: 2
        }
      );
      
      if (status) {
        status.status = 'completed';
        status.endTime = new Date();
      }
      
      return result;
    } catch (error) {
      if (status) {
        status.status = 'failed';
        status.endTime = new Date();
        
        // Provide user-friendly error messages for network issues
        if (error instanceof Error && (error as NetworkError).isRetryable !== undefined) {
          const networkError = error as NetworkError;
          status.error = NetworkErrorHandler.getUserFriendlyMessage(networkError);
        } else {
          status.error = error instanceof Error ? error.message : 'Unknown error';
        }
      }
      throw error;
    }
  }

  /**
   * Calculate overall confidence based on individual agent confidences and failures
   */
  private calculateOverallConfidence(
    riskConfidence: number,
    optimizationConfidence: number,
    criticismConfidence: number,
    failedAgentCount: number
  ): number {
    // Base confidence is average of successful agents
    const confidences = [riskConfidence, optimizationConfidence, criticismConfidence];
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

    // Reduce confidence based on failed agents
    const failurePenalty = failedAgentCount * 0.2;
    
    return Math.max(0.1, Math.min(1.0, avgConfidence - failurePenalty));
  }

  /**
   * Get current status of all agents
   */
  getAgentStatuses(): AgentExecutionStatus[] {
    return [
      { agentName: 'ParserAgent', status: 'pending' },
      { agentName: 'RiskAnalyzerAgent', status: 'pending' },
      { agentName: 'OptimizationAgent', status: 'pending' },
      { agentName: 'CriticAgent', status: 'pending' }
    ];
  }

  /**
   * Validate workflow input before analysis with comprehensive error messaging
   */
  validateInput(workflowText: string, goal: Goal): { valid: boolean; error?: string; guidance?: string } {
    // Check for empty input
    if (!workflowText || workflowText.trim().length === 0) {
      return { 
        valid: false, 
        error: 'Workflow input cannot be empty',
        guidance: 'Please provide a workflow configuration in JSON, YAML, or plain text format. Example formats:\n\n' +
                 'JSON: {"stages": [{"id": "step1", "name": "Build", "type": "task"}]}\n' +
                 'YAML: stages:\n  - id: step1\n    name: Build\n    type: task\n' +
                 'Text: Step 1: Build the application\nStep 2: Run tests'
      };
    }

    // Check for size limits
    if (workflowText.length > 100000) {
      return { 
        valid: false, 
        error: 'Workflow input is too large (maximum 100KB allowed)',
        guidance: 'Please reduce the size of your workflow configuration. Consider:\n' +
                 '• Removing unnecessary comments or documentation\n' +
                 '• Simplifying complex configurations\n' +
                 '• Breaking large workflows into smaller components'
      };
    }

    // Check for minimum content length
    if (workflowText.trim().length < 10) {
      return { 
        valid: false, 
        error: 'Workflow input is too short to be meaningful',
        guidance: 'Please provide a more detailed workflow description. Include:\n' +
                 '• At least one workflow step or stage\n' +
                 '• Clear descriptions of what each step does\n' +
                 '• Dependencies between steps if applicable'
      };
    }

    // Validate goal parameter
    if (!goal || !Object.values(Goal).includes(goal)) {
      return { 
        valid: false, 
        error: 'Invalid optimization goal specified',
        guidance: `Please select one of the following optimization goals:\n` +
                 `• ${Goal.RELIABILITY}: Focus on fault tolerance and error handling\n` +
                 `• ${Goal.COST}: Focus on resource efficiency and cost reduction\n` +
                 `• ${Goal.SIMPLICITY}: Focus on architectural simplification and maintainability`
      };
    }

    // Check for potentially problematic characters
    const suspiciousPatterns = [
      { pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/, message: 'contains control characters' },
      { pattern: /[\uFFFE\uFFFF]/, message: 'contains invalid Unicode characters' }
    ];

    for (const { pattern, message } of suspiciousPatterns) {
      if (pattern.test(workflowText)) {
        return { 
          valid: false, 
          error: `Workflow input ${message}`,
          guidance: 'Please ensure your workflow text contains only valid printable characters. ' +
                   'Copy and paste from a plain text editor if needed.'
        };
      }
    }

    // Perform basic format validation
    const formatValidation = this.validateWorkflowFormat(workflowText);
    if (!formatValidation.valid) {
      return formatValidation;
    }

    return { valid: true };
  }

  /**
   * Validate workflow format and provide specific guidance
   */
  private validateWorkflowFormat(workflowText: string): { valid: boolean; error?: string; guidance?: string } {
    const trimmed = workflowText.trim();
    
    // Try to detect and validate JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return { valid: true };
      } catch (jsonError) {
        const error = jsonError as Error;
        return {
          valid: false,
          error: 'Invalid JSON format detected',
          guidance: `JSON parsing failed: ${error.message}\n\n` +
                   'Common JSON issues:\n' +
                   '• Missing quotes around property names\n' +
                   '• Trailing commas after last array/object elements\n' +
                   '• Unescaped quotes within strings\n' +
                   '• Missing closing brackets or braces\n\n' +
                   'Use a JSON validator to check your syntax.'
        };
      }
    }

    // Try to detect and validate YAML
    if (this.looksLikeYAML(trimmed)) {
      try {
        const yaml = require('js-yaml');
        yaml.load(trimmed);
        return { valid: true };
      } catch (yamlError) {
        const error = yamlError as Error;
        return {
          valid: false,
          error: 'Invalid YAML format detected',
          guidance: `YAML parsing failed: ${error.message}\n\n` +
                   'Common YAML issues:\n' +
                   '• Incorrect indentation (use spaces, not tabs)\n' +
                   '• Missing colons after property names\n' +
                   '• Inconsistent list formatting\n' +
                   '• Special characters not properly quoted\n\n' +
                   'Use a YAML validator to check your syntax.'
        };
      }
    }

    // For text format, check if it has some structure
    const lines = trimmed.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 1 && lines[0].length < 50 && !lines[0].includes(':') && !lines[0].includes('->')) {
      return {
        valid: false,
        error: 'Workflow appears to be too simple or incomplete',
        guidance: 'For text-based workflows, please provide:\n' +
                 '• Multiple steps or stages\n' +
                 '• Clear descriptions of each step\n' +
                 '• Dependencies or sequence indicators (e.g., "Step 1:", "->", "after")\n\n' +
                 'Example:\n' +
                 'Step 1: Build application\n' +
                 'Step 2: Run tests\n' +
                 'Step 3: Deploy to staging'
      };
    }

    return { valid: true };
  }

  /**
   * Enhanced YAML detection heuristic
   */
  private looksLikeYAML(text: string): boolean {
    const lines = text.split('\n');
    let yamlFeatures = 0;
    let totalLines = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) continue;
      
      totalLines++;
      
      // Check for YAML-like patterns
      if (trimmedLine.includes(': ') || trimmedLine.endsWith(':')) yamlFeatures++;
      if (trimmedLine.startsWith('- ')) yamlFeatures++;
      if (/^\s+/.test(line) && trimmedLine.length > 0) yamlFeatures++;
      if (trimmedLine.includes('|') || trimmedLine.includes('>')) yamlFeatures++;
    }
    
    // Require at least 30% of lines to have YAML features
    return totalLines > 0 && (yamlFeatures / totalLines) >= 0.3;
  }

  /**
   * Calculate performance gain based on cache hits
   */
  private calculatePerformanceGain(cacheHitComponents: string[], totalTimeMs: number): number {
    if (cacheHitComponents.length === 0) return 0;

    // Estimate time savings based on cached components
    let estimatedSavings = 0;
    const componentWeights = {
      'parsing': 0.25,
      'risk_analysis': 0.30,
      'optimization': 0.30,
      'criticism': 0.15,
      'complete_analysis': 0.95
    };

    for (const component of cacheHitComponents) {
      estimatedSavings += componentWeights[component as keyof typeof componentWeights] || 0;
    }

    return Math.min(estimatedSavings * 100, 95); // Cap at 95%
  }

  /**
   * Optimized re-analysis method for goal changes
   */
  async reanalyzeWithNewGoal(workflowText: string, oldGoal: Goal, newGoal: Goal): Promise<AnalysisEngineResult> {
    const startTime = Date.now();
    
    // Estimate performance gain potential
    const performanceEstimate = this.resultCache.estimatePerformanceGain(workflowText, oldGoal, newGoal);
    
    if (performanceEstimate.canOptimize) {
      // Use optimized path with cached components
      return this.analyzeWorkflow(workflowText, newGoal);
    } else {
      // Fall back to regular analysis
      return this.analyzeWorkflow(workflowText, newGoal);
    }
  }

  /**
   * Get cache statistics and performance metrics
   */
  getCacheStats() {
    return this.resultCache.getStats();
  }

  /**
   * Clear cache for performance testing or memory management
   */
  clearCache(): void {
    this.resultCache.clear();
  }

  /**
   * Warm up cache with common workflow patterns
   */
  async warmupCache(commonWorkflows: Array<{ text: string; goals: Goal[] }>): Promise<void> {
    for (const workflow of commonWorkflows) {
      for (const goal of workflow.goals) {
        try {
          await this.analyzeWorkflow(workflow.text, goal);
        } catch (error) {
          // Ignore errors during warmup
          console.warn(`Cache warmup failed for workflow with goal ${goal}:`, error);
        }
      }
    }
  }

  /**
   * Perform graceful shutdown of analysis
   */
  async shutdown(): Promise<void> {
    // In a real implementation, this would cancel running operations
    // For now, it's a placeholder for cleanup operations
    console.log('AnalysisEngine shutting down gracefully');
  }
}
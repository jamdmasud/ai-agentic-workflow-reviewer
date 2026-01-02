import { AnalysisEngine, AnalysisEngineResult } from './AnalysisEngine';
import { ResultCache } from './ResultCache';
import { Goal } from '../types/goals';
import { PerformanceMetrics, CacheStats } from '../types/state';

export interface AnalysisServiceResult extends AnalysisEngineResult {
  performanceMetrics: PerformanceMetrics;
  guidance?: string;
}

/**
 * High-level service that orchestrates workflow analysis with caching optimization
 */
export class WorkflowAnalysisService {
  private analysisEngine: AnalysisEngine;
  private resultCache: ResultCache;

  constructor() {
    this.resultCache = new ResultCache(100, 60); // 100 entries, 60 minutes TTL
    this.analysisEngine = new AnalysisEngine(this.resultCache);
  }

  /**
   * Analyze workflow with performance tracking
   */
  async analyzeWorkflow(workflowText: string, goal: Goal): Promise<AnalysisServiceResult> {
    const startTime = Date.now();
    
    // Validate input first
    const validation = this.analysisEngine.validateInput(workflowText, goal);
    if (!validation.valid) {
      const endTime = Date.now();
      return {
        success: false,
        error: validation.error,
        guidance: validation.guidance,
        executedAgents: [],
        failedAgents: ['Validation'],
        performanceMetrics: {
          analysisTimeMs: endTime - startTime,
          fromCache: false,
          cacheHitComponents: [],
          performanceGain: 0,
          executedAgents: [],
          failedAgents: ['Validation']
        }
      };
    }

    const result = await this.analysisEngine.analyzeWorkflow(workflowText, goal);
    const endTime = Date.now();

    const performanceMetrics: PerformanceMetrics = {
      analysisTimeMs: endTime - startTime,
      fromCache: result.fromCache || false,
      cacheHitComponents: result.cacheHitComponents || [],
      performanceGain: result.performanceGain || 0,
      executedAgents: result.executedAgents,
      failedAgents: result.failedAgents
    };

    return {
      ...result,
      performanceMetrics
    };
  }

  /**
   * Re-analyze workflow with goal change optimization
   */
  async reanalyzeWithNewGoal(
    workflowText: string, 
    oldGoal: Goal, 
    newGoal: Goal
  ): Promise<AnalysisServiceResult> {
    const startTime = Date.now();
    
    // Use the optimized re-analysis method
    const result = await this.analysisEngine.reanalyzeWithNewGoal(workflowText, oldGoal, newGoal);
    const endTime = Date.now();

    const performanceMetrics: PerformanceMetrics = {
      analysisTimeMs: endTime - startTime,
      fromCache: result.fromCache || false,
      cacheHitComponents: result.cacheHitComponents || [],
      performanceGain: result.performanceGain || 0,
      executedAgents: result.executedAgents,
      failedAgents: result.failedAgents
    };

    return {
      ...result,
      performanceMetrics
    };
  }

  /**
   * Get current cache statistics
   */
  getCacheStats(): CacheStats {
    const stats = this.analysisEngine.getCacheStats();
    return {
      totalEntries: stats.totalEntries,
      hitRate: stats.hitRate,
      totalHits: stats.totalHits,
      totalMisses: stats.totalMisses,
      averageAge: stats.averageAge
    };
  }

  /**
   * Estimate performance gain for goal change
   */
  estimateReanalysisPerformance(
    workflowText: string, 
    currentGoal: Goal, 
    newGoal: Goal
  ): {
    canOptimize: boolean;
    estimatedSpeedupPercent: number;
    availableComponents: string[];
  } {
    return this.resultCache.estimatePerformanceGain(workflowText, currentGoal, newGoal);
  }

  /**
   * Clear cache for testing or memory management
   */
  clearCache(): void {
    this.analysisEngine.clearCache();
  }

  /**
   * Warm up cache with common workflow patterns
   */
  async warmupCache(commonWorkflows: Array<{ text: string; goals: Goal[] }>): Promise<void> {
    await this.analysisEngine.warmupCache(commonWorkflows);
  }

  /**
   * Preload analysis for all goals to optimize future goal changes
   */
  async preloadAllGoals(workflowText: string): Promise<{
    [key in Goal]: AnalysisServiceResult
  }> {
    const results = {} as { [key in Goal]: AnalysisServiceResult };
    
    // Analyze for all goals in parallel to populate cache
    const analysisPromises = Object.values(Goal).map(async (goal) => {
      const result = await this.analyzeWorkflow(workflowText, goal);
      results[goal] = result;
      return result;
    });

    await Promise.all(analysisPromises);
    return results;
  }

  /**
   * Get analysis history with performance metrics
   */
  getAnalysisHistory(workflowText: string): Array<{
    goal: Goal;
    timestamp: Date;
    performanceMetrics: PerformanceMetrics;
    fromCache: boolean;
  }> {
    // This would typically be stored in a more persistent way
    // For now, return empty array as this is handled by the UI state
    return [];
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown(): Promise<void> {
    await this.analysisEngine.shutdown();
  }
}
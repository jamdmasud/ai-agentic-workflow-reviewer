import { WorkflowStructure } from '../types/workflow';
import { AnalysisResults } from '../types/analysis';
import { Goal } from '../types/goals';
import { ParseResult } from '../agents/ParserAgent';
import { RiskAnalysis } from '../agents/RiskAnalyzerAgent';
import { OptimizationSuggestions } from '../agents/OptimizationAgent';
import { CriticismReport } from '../agents/CriticAgent';

export interface CacheEntry {
  id: string;
  workflowHash: string;
  goal: Goal;
  timestamp: Date;
  expiresAt: Date;
  parseResult?: ParseResult;
  riskAnalysis?: RiskAnalysis;
  optimizationSuggestions?: OptimizationSuggestions;
  criticismReport?: CriticismReport;
  finalResults?: AnalysisResults;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  averageAge: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

export class ResultCache {
  private cache: Map<string, CacheEntry>;
  private maxEntries: number;
  private defaultTtlMs: number;
  private hitCount: number;
  private missCount: number;

  constructor(maxEntries: number = 100, defaultTtlMinutes: number = 60) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMinutes * 60 * 1000;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Generate a cache key for workflow and goal combination
   */
  private generateCacheKey(workflowText: string, goal: Goal): string {
    const workflowHash = this.hashWorkflow(workflowText);
    return `${workflowHash}-${goal}`;
  }

  /**
   * Generate a hash for workflow content
   */
  private hashWorkflow(workflowText: string): string {
    // Simple hash function - in production, consider using a more robust hash
    let hash = 0;
    const normalizedText = workflowText.trim().replace(/\s+/g, ' ');
    
    for (let i = 0; i < normalizedText.length; i++) {
      const char = normalizedText.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Store parse result in cache
   */
  storeParsedWorkflow(workflowText: string, goal: Goal, parseResult: ParseResult): void {
    const key = this.generateCacheKey(workflowText, goal);
    const workflowHash = this.hashWorkflow(workflowText);
    
    let entry = this.cache.get(key);
    if (!entry) {
      entry = this.createCacheEntry(key, workflowHash, goal);
      this.cache.set(key, entry);
    }
    
    entry.parseResult = parseResult;
    this.evictExpiredEntries();
  }

  /**
   * Store risk analysis result in cache
   */
  storeRiskAnalysis(workflowText: string, goal: Goal, riskAnalysis: RiskAnalysis): void {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.riskAnalysis = riskAnalysis;
    }
  }

  /**
   * Store optimization suggestions in cache
   */
  storeOptimizationSuggestions(workflowText: string, goal: Goal, optimizationSuggestions: OptimizationSuggestions): void {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.optimizationSuggestions = optimizationSuggestions;
    }
  }

  /**
   * Store criticism report in cache
   */
  storeCriticismReport(workflowText: string, goal: Goal, criticismReport: CriticismReport): void {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.criticismReport = criticismReport;
    }
  }

  /**
   * Store final analysis results in cache
   */
  storeFinalResults(workflowText: string, goal: Goal, results: AnalysisResults): void {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.finalResults = results;
    }
  }

  /**
   * Retrieve cached parse result
   */
  getCachedParseResult(workflowText: string, goal: Goal): ParseResult | null {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry && !this.isExpired(entry) && entry.parseResult) {
      this.hitCount++;
      return entry.parseResult;
    }
    
    this.missCount++;
    return null;
  }

  /**
   * Retrieve cached risk analysis
   */
  getCachedRiskAnalysis(workflowText: string, goal: Goal): RiskAnalysis | null {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry && !this.isExpired(entry) && entry.riskAnalysis) {
      this.hitCount++;
      return entry.riskAnalysis;
    }
    
    this.missCount++;
    return null;
  }

  /**
   * Retrieve cached optimization suggestions
   */
  getCachedOptimizationSuggestions(workflowText: string, goal: Goal): OptimizationSuggestions | null {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry && !this.isExpired(entry) && entry.optimizationSuggestions) {
      this.hitCount++;
      return entry.optimizationSuggestions;
    }
    
    this.missCount++;
    return null;
  }

  /**
   * Retrieve cached criticism report
   */
  getCachedCriticismReport(workflowText: string, goal: Goal): CriticismReport | null {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry && !this.isExpired(entry) && entry.criticismReport) {
      this.hitCount++;
      return entry.criticismReport;
    }
    
    this.missCount++;
    return null;
  }

  /**
   * Retrieve cached final results
   */
  getCachedResults(workflowText: string, goal: Goal): AnalysisResults | null {
    const key = this.generateCacheKey(workflowText, goal);
    const entry = this.cache.get(key);
    
    if (entry && !this.isExpired(entry) && entry.finalResults) {
      this.hitCount++;
      return entry.finalResults;
    }
    
    this.missCount++;
    return null;
  }

  /**
   * Check if we can reuse parsed workflow for different goal
   */
  canReuseParsedWorkflow(workflowText: string): {
    canReuse: boolean;
    availableGoals: Goal[];
    parseResult?: ParseResult;
  } {
    const workflowHash = this.hashWorkflow(workflowText);
    const availableGoals: Goal[] = [];
    let parseResult: ParseResult | undefined;

    // Check all goals for this workflow
    for (const goal of Object.values(Goal)) {
      const key = `${workflowHash}-${goal}`;
      const entry = this.cache.get(key);
      
      if (entry && !this.isExpired(entry) && entry.parseResult) {
        availableGoals.push(goal);
        if (!parseResult) {
          parseResult = entry.parseResult;
        }
      }
    }

    return {
      canReuse: availableGoals.length > 0,
      availableGoals,
      parseResult
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hitCount + this.missCount;
    
    let totalAge = 0;
    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;

    for (const entry of entries) {
      const age = Date.now() - entry.timestamp.getTime();
      totalAge += age;
      
      if (!oldestEntry || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      
      if (!newestEntry || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    return {
      totalEntries: entries.length,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      totalHits: this.hitCount,
      totalMisses: this.missCount,
      averageAge: entries.length > 0 ? totalAge / entries.length : 0,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Clear cache entries for a specific workflow
   */
  clearWorkflow(workflowText: string): void {
    const workflowHash = this.hashWorkflow(workflowText);
    
    for (const goal of Object.values(Goal)) {
      const key = `${workflowHash}-${goal}`;
      this.cache.delete(key);
    }
  }

  /**
   * Clear expired entries
   */
  evictExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt.getTime()) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    // If still over capacity, remove oldest entries
    if (this.cache.size > this.maxEntries) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      const entriesToRemove = entries.slice(0, this.cache.size - this.maxEntries);
      for (const [key] of entriesToRemove) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Create a new cache entry
   */
  private createCacheEntry(id: string, workflowHash: string, goal: Goal): CacheEntry {
    const now = new Date();
    return {
      id,
      workflowHash,
      goal,
      timestamp: now,
      expiresAt: new Date(now.getTime() + this.defaultTtlMs)
    };
  }

  /**
   * Check if a cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt.getTime();
  }

  /**
   * Estimate cache performance improvement for re-analysis
   */
  estimatePerformanceGain(workflowText: string, currentGoal: Goal, newGoal: Goal): {
    canOptimize: boolean;
    estimatedSpeedupPercent: number;
    availableComponents: string[];
  } {
    const workflowHash = this.hashWorkflow(workflowText);
    const currentKey = `${workflowHash}-${currentGoal}`;
    const newKey = `${workflowHash}-${newGoal}`;
    
    const currentEntry = this.cache.get(currentKey);
    const newEntry = this.cache.get(newKey);
    
    const availableComponents: string[] = [];
    let estimatedSpeedupPercent = 0;

    // Check what components can be reused
    if (currentEntry && !this.isExpired(currentEntry)) {
      if (currentEntry.parseResult) {
        availableComponents.push('parsing');
        estimatedSpeedupPercent += 25; // Parsing typically takes ~25% of total time
      }
      
      // Risk analysis and optimization are goal-dependent, so less reusable
      if (currentEntry.riskAnalysis && currentGoal === newGoal) {
        availableComponents.push('risk_analysis');
        estimatedSpeedupPercent += 30;
      }
      
      if (currentEntry.optimizationSuggestions && currentGoal === newGoal) {
        availableComponents.push('optimization');
        estimatedSpeedupPercent += 30;
      }
      
      if (currentEntry.criticismReport && currentGoal === newGoal) {
        availableComponents.push('criticism');
        estimatedSpeedupPercent += 15;
      }
    }

    return {
      canOptimize: availableComponents.length > 0,
      estimatedSpeedupPercent: Math.min(estimatedSpeedupPercent, 90), // Cap at 90%
      availableComponents
    };
  }
}
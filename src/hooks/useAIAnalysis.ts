import { useState, useCallback, useRef } from 'react';
import { Goal } from '../types/goals';
import { AnalysisResults } from '../types/analysis';
import { AIAnalysisEngine, AIAnalysisEngineResult } from '../orchestration/AIAnalysisEngine';
import { AIAgentConfig } from '../agents/AIAgent';

export interface AIAnalysisState {
  isAnalyzing: boolean;
  results: AnalysisResults | null;
  error: string | null;
  guidance: string | null;
  executedAgents: string[];
  failedAgents: string[];
  fromCache: boolean;
  performanceGain: number;
  aiInsights?: {
    optimizationAnalysis?: string;
    riskAnalysis?: string;
    criticismAnalysis?: string;
    overallConfidence?: number;
  };
}

export interface UseAIAnalysisReturn {
  state: AIAnalysisState;
  analyzeWorkflow: (workflowText: string, goal: Goal) => Promise<AnalysisResults | null>;
  clearResults: () => void;
  updateAIConfig: (config: AIAgentConfig) => void;
  testAIConnection: () => Promise<{ success: boolean; error?: string; provider?: string }>;
  getAIConfig: () => Omit<AIAgentConfig, 'apiKey'>;
}

const DEFAULT_AI_CONFIG: AIAgentConfig = {
  provider: 'openai',
  model: 'gpt-4.1',
  temperature: 0.3,
  maxTokens: 2000
};

export function useAIAnalysis(initialConfig?: AIAgentConfig): UseAIAnalysisReturn {
  const [state, setState] = useState<AIAnalysisState>({
    isAnalyzing: false,
    results: null,
    error: null,
    guidance: null,
    executedAgents: [],
    failedAgents: [],
    fromCache: false,
    performanceGain: 0
  });

  const aiEngineRef = useRef<AIAnalysisEngine | null>(null);
  const configRef = useRef<AIAgentConfig>(initialConfig || DEFAULT_AI_CONFIG);

  // Initialize or update AI engine
  const getAIEngine = useCallback(() => {
    if (!aiEngineRef.current) {
      aiEngineRef.current = new AIAnalysisEngine(configRef.current);
    }
    return aiEngineRef.current;
  }, []);

  const analyzeWorkflow = useCallback(async (workflowText: string, goal: Goal): Promise<AnalysisResults | null> => {
    console.log('AI Hook: Starting analysis...')
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      guidance: null,
      results: null
    }));

    try {
      const engine = getAIEngine();
      console.log('AI Hook: Calling engine.analyzeWorkflow...')
      const result: AIAnalysisEngineResult = await engine.analyzeWorkflow(workflowText, goal);
      console.log('AI Hook: Engine returned result:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        executedAgents: result.executedAgents,
        failedAgents: result.failedAgents
      })

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        results: result.data || null,
        error: result.error || null,
        guidance: result.guidance || null,
        executedAgents: result.executedAgents,
        failedAgents: result.failedAgents,
        fromCache: result.fromCache || false,
        performanceGain: result.performanceGain || 0,
        aiInsights: result.data?.aiInsights
      }));

      console.log('AI Hook: State updated, returning result data:', !!result.data)

      // Show user-friendly messages based on results
      if (!result.success && result.failedAgents.includes('AIConfiguration')) {
        setState(prev => ({
          ...prev,
          guidance: 'Please configure your AI settings before running analysis.'
        }));
      } else if (!result.success && result.failedAgents.includes('NetworkConnectivity')) {
        setState(prev => ({
          ...prev,
          guidance: 'Network connection required for AI analysis. Please check your internet connection.'
        }));
      } else if (result.failedAgents.length > 0 && result.failedAgents.length < 3) {
        setState(prev => ({
          ...prev,
          guidance: 'Some AI agents failed, but analysis was completed with available results.'
        }));
      }

      // Return the result data directly
      return result.data || null;

    } catch (error) {
      console.error('AI Hook: Exception occurred:', error)
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        guidance: 'Please check your AI configuration and try again.'
      }));
      
      return null;
    }
  }, [getAIEngine]);

  const clearResults = useCallback(() => {
    setState({
      isAnalyzing: false,
      results: null,
      error: null,
      guidance: null,
      executedAgents: [],
      failedAgents: [],
      fromCache: false,
      performanceGain: 0
    });
  }, []);

  const updateAIConfig = useCallback((config: AIAgentConfig) => {
    configRef.current = { ...configRef.current, ...config };
    
    // Update existing engine or create new one
    if (aiEngineRef.current) {
      aiEngineRef.current.updateAIConfig(config);
    } else {
      aiEngineRef.current = new AIAnalysisEngine(configRef.current);
    }

    // Clear results when config changes significantly
    if (config.provider || config.apiKey || config.baseUrl) {
      clearResults();
    }
  }, [clearResults]);

  const testAIConnection = useCallback(async () => {
    try {
      const engine = getAIEngine();
      return await engine.testAIConnectivity();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        provider: configRef.current.provider
      };
    }
  }, [getAIEngine]);

  const getAIConfig = useCallback(() => {
    const engine = getAIEngine();
    return engine.getAIConfig();
  }, [getAIEngine]);

  return {
    state,
    analyzeWorkflow,
    clearResults,
    updateAIConfig,
    testAIConnection,
    getAIConfig
  };
}

// Hook for managing AI configuration persistence
export function useAIConfigPersistence() {
  const STORAGE_KEY = 'ai-workflow-analyzer-config';
  const SECURE_STORAGE_KEY = 'ai-workflow-analyzer-secure';

  const loadConfig = useCallback((): AIAgentConfig => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return DEFAULT_AI_CONFIG;
      }

      // Load non-sensitive config from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      let config = DEFAULT_AI_CONFIG;
      
      if (stored) {
        const parsed = JSON.parse(stored);
        config = { ...DEFAULT_AI_CONFIG, ...parsed };
      }

      // Load sensitive data from sessionStorage (cleared when browser closes)
      const secureStored = sessionStorage.getItem(SECURE_STORAGE_KEY);
      if (secureStored) {
        const secureData = JSON.parse(secureStored);
        config = { ...config, ...secureData };
      }

      return config;
    } catch (error) {
      console.warn('Failed to load AI config:', error);
      return DEFAULT_AI_CONFIG;
    }
  }, []);

  const saveConfig = useCallback((config: AIAgentConfig) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return;
      }

      // Store non-sensitive data in localStorage (persists across sessions)
      const { apiKey, ...safeConfig } = config;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));

      // Store sensitive data in sessionStorage (cleared when browser closes)
      if (apiKey) {
        sessionStorage.setItem(SECURE_STORAGE_KEY, JSON.stringify({ apiKey }));
      } else {
        sessionStorage.removeItem(SECURE_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to save AI config:', error);
    }
  }, []);

  const clearConfig = useCallback(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SECURE_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear AI config:', error);
    }
  }, []);

  return {
    loadConfig,
    saveConfig,
    clearConfig
  };
}
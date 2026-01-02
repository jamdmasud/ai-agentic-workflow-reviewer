import { WorkflowStructure } from '../types/workflow';
import { Goal } from '../types/goals';

export interface AIAgentConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: 'openai' | 'anthropic' | 'local';
  baseUrl?: string;
}

export interface AIAnalysisResult {
  analysis: string;
  suggestions: string[];
  confidence: number;
  reasoning: string;
}

export abstract class AIAgent {
  protected config: AIAgentConfig;

  constructor(config: AIAgentConfig = {}) {
    this.config = {
      model: 'gpt-4.1',
      temperature: 0.3,
      maxTokens: 2000,
      provider: 'openai',
      ...config
    };
  }

  /**
   * Main method to analyze workflow using AI
   */
  abstract analyzeWorkflow(
    workflowText: string,
    structure: WorkflowStructure,
    goal: Goal,
    context?: any
  ): Promise<AIAnalysisResult>;

  /**
   * Make API call to AI provider
   */
  protected async callAI(prompt: string, systemPrompt?: string): Promise<string> {
    console.log('AIAgent: Making API call to provider:', this.config.provider);
    
    try {
      let response: string;
      
      switch (this.config.provider) {
        case 'openai':
          response = await this.callOpenAI(prompt, systemPrompt);
          break;
        case 'anthropic':
          response = await this.callAnthropic(prompt, systemPrompt);
          break;
        case 'local':
          response = await this.callLocalModel(prompt, systemPrompt);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
      
      console.log('AIAgent: API call successful, response length:', response.length);
      console.log('AIAgent: Response preview:', response.substring(0, 500) + (response.length > 500 ? '...' : ''));
      
      return response;
    } catch (error) {
      console.error('AIAgent: API call failed:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!this.config.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format. API key should start with "sk-"');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `OpenAI API error: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch {
        errorMessage += ` - ${response.statusText}`;
      }

      // Provide specific guidance for common errors
      if (response.status === 404) {
        errorMessage += '. This usually means the model name is invalid or the API endpoint is incorrect.';
      } else if (response.status === 401) {
        errorMessage += '. Please check your API key is correct and has sufficient permissions.';
      } else if (response.status === 429) {
        errorMessage += '. You have exceeded your API rate limit or quota.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }

    return data.choices[0].message.content || '';
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    if (!this.config.apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Anthropic API key format. API key should start with "sk-ant-"');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Anthropic API error: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch {
        errorMessage += ` - ${response.statusText}`;
      }

      // Provide specific guidance for common errors
      if (response.status === 404) {
        errorMessage += '. This usually means the model name is invalid or the API endpoint is incorrect.';
      } else if (response.status === 401) {
        errorMessage += '. Please check your API key is correct and has sufficient permissions.';
      } else if (response.status === 429) {
        errorMessage += '. You have exceeded your API rate limit or quota.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Anthropic API');
    }

    return data.content[0].text || '';
  }

  /**
   * Call local model (e.g., Ollama)
   */
  private async callLocalModel(prompt: string, systemPrompt?: string): Promise<string> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          model: this.config.model || 'llama2',
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Local model API error: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch {
          errorMessage += ` - ${response.statusText}`;
        }

        // Provide specific guidance for common errors
        if (response.status === 404) {
          errorMessage += '. Make sure Ollama is running and the model is installed. Try: ollama pull ' + (this.config.model || 'llama2');
        } else if (response.status === 500) {
          errorMessage += '. The local model service encountered an error. Check if the model is properly loaded.';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid response format from local model API');
      }

      return data.response || '';
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to local model at ${baseUrl}. Make sure Ollama is running with: ollama serve`);
      }
      throw error;
    }
  }

  /**
   * Parse AI response into structured format
   */
  protected parseAIResponse(response: string): AIAnalysisResult {
    console.log('AIAgent: Parsing AI response:', {
      responseLength: response.length,
      responsePreview: response.substring(0, 200) + (response.length > 200 ? '...' : '')
    });

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      console.log('AIAgent: Successfully parsed as JSON:', {
        hasAnalysis: !!parsed.analysis,
        hasSuggestions: !!parsed.suggestions,
        suggestionsCount: parsed.suggestions?.length || 0,
        hasConfidence: !!parsed.confidence,
        hasReasoning: !!parsed.reasoning
      });

      const result = {
        analysis: parsed.analysis || '',
        suggestions: parsed.suggestions || [],
        confidence: parsed.confidence || 0.7,
        reasoning: parsed.reasoning || ''
      };

      console.log('AIAgent: Final parsed result:', {
        analysisLength: result.analysis.length,
        suggestionsCount: result.suggestions.length,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      console.log('AIAgent: JSON parsing failed, falling back to text parsing:', error);
      // Fallback to text parsing
      return this.parseTextResponse(response);
    }
  }

  /**
   * Parse plain text AI response
   */
  private parseTextResponse(response: string): AIAnalysisResult {
    console.log('AIAgent: Using text parsing fallback for response:', response.substring(0, 300));

    const lines = response.split('\n').filter(line => line.trim());
    
    let analysis = '';
    let suggestions: string[] = [];
    let reasoning = '';
    let confidence = 0.7;

    let currentSection = 'analysis';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('suggestions:') || trimmed.toLowerCase().includes('recommendations:')) {
        currentSection = 'suggestions';
        continue;
      } else if (trimmed.toLowerCase().includes('reasoning:') || trimmed.toLowerCase().includes('rationale:')) {
        currentSection = 'reasoning';
        continue;
      } else if (trimmed.toLowerCase().includes('confidence:')) {
        const match = trimmed.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          confidence = Math.min(1.0, Math.max(0.0, parseFloat(match[1]) / 100));
        }
        continue;
      }

      if (currentSection === 'analysis') {
        analysis += trimmed + ' ';
      } else if (currentSection === 'suggestions') {
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
          suggestions.push(trimmed.replace(/^[-•\d.]\s*/, ''));
        }
      } else if (currentSection === 'reasoning') {
        reasoning += trimmed + ' ';
      }
    }

    const result = {
      analysis: analysis.trim(),
      suggestions,
      confidence,
      reasoning: reasoning.trim()
    };

    console.log('AIAgent: Text parsing result:', {
      analysisLength: result.analysis.length,
      suggestionsCount: result.suggestions.length,
      confidence: result.confidence
    });

    return result;
  }
}
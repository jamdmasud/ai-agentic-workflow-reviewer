import * as yaml from 'js-yaml';
import { WorkflowStructure, Stage, Dependency, Trigger, Resource, WorkflowMetadata, StageType, DependencyType, TriggerType, ResourceType, BackoffStrategy } from '../types/workflow';

export enum WorkflowFormat {
  JSON = 'json',
  YAML = 'yaml',
  TEXT = 'text'
}

export interface ParseResult {
  success: boolean;
  data?: WorkflowStructure;
  error?: string;
  format?: WorkflowFormat;
}

export class ParserAgent {
  /**
   * Main parsing method that detects format and parses accordingly
   */
  async parse(workflowText: string): Promise<ParseResult> {
    if (!workflowText || workflowText.trim().length === 0) {
      return {
        success: false,
        error: 'Workflow input cannot be empty'
      };
    }

    const format = this.detectFormat(workflowText);
    
    try {
      let data: WorkflowStructure;
      
      switch (format) {
        case WorkflowFormat.JSON:
          data = await this.parseJSON(workflowText);
          break;
        case WorkflowFormat.YAML:
          data = await this.parseYAML(workflowText);
          break;
        case WorkflowFormat.TEXT:
          data = await this.parseText(workflowText);
          break;
        default:
          return {
            success: false,
            error: 'Unable to detect workflow format. Please provide valid JSON, YAML, or structured text.'
          };
      }

      // Validate the parsed structure
      const validationError = this.validateWorkflowStructure(data);
      if (validationError) {
        return {
          success: false,
          error: validationError
        };
      }

      return {
        success: true,
        data,
        format
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse ${format} format: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Detects the format of the input workflow text
   */
  private detectFormat(workflowText: string): WorkflowFormat {
    const trimmed = workflowText.trim();
    
    // Check for JSON format
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return WorkflowFormat.JSON;
      } catch {
        // Not valid JSON, continue checking
      }
    }

    // Check for YAML format
    if (this.looksLikeYAML(trimmed)) {
      try {
        yaml.load(trimmed);
        return WorkflowFormat.YAML;
      } catch {
        // Not valid YAML, continue checking
      }
    }

    // Default to text format
    return WorkflowFormat.TEXT;
  }

  /**
   * Heuristic to determine if text looks like YAML
   */
  private looksLikeYAML(text: string): boolean {
    const lines = text.split('\n');
    let hasYamlFeatures = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) continue;
      
      // Check for YAML-like patterns
      if (trimmedLine.includes(': ') || trimmedLine.endsWith(':')) hasYamlFeatures++;
      if (trimmedLine.startsWith('- ')) hasYamlFeatures++;
      if (/^\s+/.test(line) && trimmedLine.length > 0) hasYamlFeatures++;
    }
    
    return hasYamlFeatures >= 2;
  }

  /**
   * Parse JSON format workflow
   */
  private async parseJSON(workflowText: string): Promise<WorkflowStructure> {
    const parsed = JSON.parse(workflowText);
    return this.normalizeToWorkflowStructure(parsed);
  }

  /**
   * Parse YAML format workflow
   */
  private async parseYAML(workflowText: string): Promise<WorkflowStructure> {
    const parsed = yaml.load(workflowText) as any;
    return this.normalizeToWorkflowStructure(parsed);
  }

  /**
   * Parse text format workflow using natural language processing
   */
  private async parseText(workflowText: string): Promise<WorkflowStructure> {
    const lines = workflowText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const stages: Stage[] = [];
    const dependencies: Dependency[] = [];
    const triggers: Trigger[] = [];
    const resources: Resource[] = [];
    
    let currentStageId = 1;
    
    for (const line of lines) {
      // Extract stages from text patterns
      if (this.isStageDescription(line)) {
        const stage = this.extractStageFromText(line, currentStageId++);
        stages.push(stage);
      }
      
      // Extract dependencies
      const dependency = this.extractDependencyFromText(line);
      if (dependency) {
        dependencies.push(dependency);
      }
      
      // Extract triggers
      const trigger = this.extractTriggerFromText(line);
      if (trigger) {
        triggers.push(trigger);
      }
    }
    
    // If no stages were extracted, create a default one
    if (stages.length === 0) {
      stages.push({
        id: 'stage-1',
        name: 'Main Workflow',
        type: StageType.TASK,
        configuration: { description: workflowText },
        dependencies: []
      });
    }

    return {
      stages,
      dependencies,
      triggers,
      resources,
      metadata: {
        name: 'Text-based Workflow',
        version: '1.0.0',
        description: 'Workflow parsed from text description',
        created: new Date(),
        modified: new Date()
      }
    };
  }

  /**
   * Normalize parsed data to WorkflowStructure format
   */
  private normalizeToWorkflowStructure(parsed: any): WorkflowStructure {
    return {
      stages: this.normalizeStages(parsed.stages || parsed.steps || []),
      dependencies: this.normalizeDependencies(parsed.dependencies || []),
      triggers: this.normalizeTriggers(parsed.triggers || []),
      resources: this.normalizeResources(parsed.resources || []),
      metadata: this.normalizeMetadata(parsed.metadata || parsed)
    };
  }

  /**
   * Normalize stages array
   */
  private normalizeStages(stages: any[]): Stage[] {
    return stages.map((stage, index) => ({
      id: stage.id || `stage-${index + 1}`,
      name: stage.name || stage.title || `Stage ${index + 1}`,
      type: this.normalizeStageType(stage.type),
      configuration: stage.configuration || stage.config || {},
      dependencies: stage.dependencies || stage.depends_on || [],
      retryPolicy: stage.retryPolicy || stage.retry ? {
        maxAttempts: stage.retryPolicy?.maxAttempts || stage.retry?.maxAttempts || 3,
        backoffStrategy: BackoffStrategy.EXPONENTIAL,
        retryConditions: stage.retryPolicy?.retryConditions || ['failure']
      } : undefined
    }));
  }

  /**
   * Normalize dependencies array
   */
  private normalizeDependencies(dependencies: any[]): Dependency[] {
    return dependencies.map(dep => ({
      from: dep.from || dep.source,
      to: dep.to || dep.target,
      type: this.normalizeDependencyType(dep.type),
      condition: dep.condition
    }));
  }

  /**
   * Normalize triggers array
   */
  private normalizeTriggers(triggers: any[]): Trigger[] {
    return triggers.map((trigger, index) => ({
      id: trigger.id || `trigger-${index + 1}`,
      type: this.normalizeTriggerType(trigger.type),
      condition: trigger.condition || trigger.when || '',
      targetStages: trigger.targetStages || trigger.targets || []
    }));
  }

  /**
   * Normalize resources array
   */
  private normalizeResources(resources: any[]): Resource[] {
    return resources.map((resource, index) => ({
      id: resource.id || `resource-${index + 1}`,
      type: this.normalizeResourceType(resource.type),
      configuration: resource.configuration || resource.config || {},
      allocation: resource.allocation
    }));
  }

  /**
   * Normalize metadata
   */
  private normalizeMetadata(metadata: any): WorkflowMetadata {
    return {
      name: metadata.name || 'Unnamed Workflow',
      version: metadata.version || '1.0.0',
      description: metadata.description,
      author: metadata.author,
      created: metadata.created ? new Date(metadata.created) : new Date(),
      modified: metadata.modified ? new Date(metadata.modified) : new Date(),
      tags: metadata.tags || []
    };
  }

  /**
   * Helper methods for text parsing
   */
  private isStageDescription(line: string): boolean {
    const stageKeywords = ['step', 'stage', 'task', 'job', 'action', 'process'];
    return stageKeywords.some(keyword => 
      line.toLowerCase().includes(keyword) || 
      /^\d+\./.test(line) || 
      line.includes('->') || 
      line.includes('=>')
    );
  }

  private extractStageFromText(line: string, id: number): Stage {
    const name = line.replace(/^\d+\.\s*/, '').replace(/^(step|stage|task|job|action|process):?\s*/i, '').trim();
    
    return {
      id: `stage-${id}`,
      name: name || `Stage ${id}`,
      type: StageType.TASK,
      configuration: { description: line },
      dependencies: []
    };
  }

  private extractDependencyFromText(line: string): Dependency | null {
    const dependencyPatterns = [
      /(.+?)\s*->\s*(.+)/,
      /(.+?)\s*=>\s*(.+)/,
      /(.+?)\s*depends on\s*(.+)/i,
      /after\s*(.+?),?\s*(.+)/i
    ];

    for (const pattern of dependencyPatterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          from: match[1].trim(),
          to: match[2].trim(),
          type: DependencyType.SEQUENTIAL
        };
      }
    }

    return null;
  }

  private extractTriggerFromText(line: string): Trigger | null {
    const triggerPatterns = [
      /trigger(?:ed)?\s*(?:on|by)\s*(.+)/i,
      /when\s*(.+)/i,
      /on\s*(.+)/i
    ];

    for (const pattern of triggerPatterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          id: `trigger-${Date.now()}`,
          type: TriggerType.EVENT,
          condition: match[1].trim(),
          targetStages: []
        };
      }
    }

    return null;
  }

  /**
   * Type normalization helpers
   */
  private normalizeStageType(type: string): StageType {
    if (!type) return StageType.TASK;
    
    const typeMap: Record<string, StageType> = {
      'task': StageType.TASK,
      'condition': StageType.CONDITION,
      'parallel': StageType.PARALLEL,
      'sequential': StageType.SEQUENTIAL,
      'loop': StageType.LOOP
    };
    
    return typeMap[type.toLowerCase()] || StageType.TASK;
  }

  private normalizeDependencyType(type: string): DependencyType {
    if (!type) return DependencyType.SEQUENTIAL;
    
    const typeMap: Record<string, DependencyType> = {
      'sequential': DependencyType.SEQUENTIAL,
      'conditional': DependencyType.CONDITIONAL,
      'resource': DependencyType.RESOURCE,
      'data': DependencyType.DATA
    };
    
    return typeMap[type.toLowerCase()] || DependencyType.SEQUENTIAL;
  }

  private normalizeTriggerType(type: string): TriggerType {
    if (!type) return TriggerType.EVENT;
    
    const typeMap: Record<string, TriggerType> = {
      'schedule': TriggerType.SCHEDULE,
      'event': TriggerType.EVENT,
      'webhook': TriggerType.WEBHOOK,
      'manual': TriggerType.MANUAL
    };
    
    return typeMap[type.toLowerCase()] || TriggerType.EVENT;
  }

  private normalizeResourceType(type: string): ResourceType {
    if (!type) return ResourceType.COMPUTE;
    
    const typeMap: Record<string, ResourceType> = {
      'compute': ResourceType.COMPUTE,
      'storage': ResourceType.STORAGE,
      'network': ResourceType.NETWORK,
      'database': ResourceType.DATABASE
    };
    
    return typeMap[type.toLowerCase()] || ResourceType.COMPUTE;
  }

  /**
   * Validate the parsed workflow structure
   */
  private validateWorkflowStructure(workflow: WorkflowStructure): string | null {
    if (!workflow.stages || workflow.stages.length === 0) {
      return 'Workflow must contain at least one stage';
    }

    // Validate stage IDs are unique
    const stageIds = workflow.stages.map(s => s.id);
    const uniqueIds = new Set(stageIds);
    if (stageIds.length !== uniqueIds.size) {
      return 'Stage IDs must be unique';
    }

    // Validate dependencies reference existing stages
    for (const dep of workflow.dependencies) {
      if (!stageIds.includes(dep.from) || !stageIds.includes(dep.to)) {
        return `Dependency references non-existent stage: ${dep.from} -> ${dep.to}`;
      }
    }

    // Validate metadata
    if (!workflow.metadata.name || workflow.metadata.name.trim().length === 0) {
      return 'Workflow metadata must include a name';
    }

    return null;
  }
}
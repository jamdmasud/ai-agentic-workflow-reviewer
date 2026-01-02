import * as fc from 'fast-check'
import { Goal, WorkflowStructure, AnalysisResults } from '@/types'

describe('Project Setup', () => {
  test('TypeScript types are properly exported', () => {
    expect(Goal.RELIABILITY).toBe('reliability')
    expect(Goal.COST).toBe('cost')
    expect(Goal.SIMPLICITY).toBe('simplicity')
  })

  test('fast-check property testing framework works', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n
      }),
      { numRuns: 10 }
    )
  })

  test('WorkflowStructure interface is available', () => {
    const mockWorkflow: Partial<WorkflowStructure> = {
      stages: [],
      dependencies: [],
      triggers: [],
      resources: []
    }
    
    expect(mockWorkflow.stages).toEqual([])
  })

  test('AnalysisResults interface is available', () => {
    const mockResults: Partial<AnalysisResults> = {
      risks: [],
      bottlenecks: [],
      missingSteps: [],
      improvements: []
    }
    
    expect(mockResults.risks).toEqual([])
  })
})
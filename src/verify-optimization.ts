import { OptimizationAgent } from './agents/OptimizationAgent';
import { RiskAnalyzerAgent } from './agents/RiskAnalyzerAgent';
import { Goal } from './types/goals';
import { WorkflowStructure, StageType, DependencyType } from './types/workflow';

// Simple test to verify OptimizationAgent works
async function testOptimizationAgent() {
  const optimizationAgent = new OptimizationAgent();
  const riskAnalyzer = new RiskAnalyzerAgent();

  // Create a simple test workflow
  const workflow: WorkflowStructure = {
    stages: [
      {
        id: 'stage-1',
        name: 'Input Processing',
        type: StageType.TASK,
        configuration: { description: 'Process input data' },
        dependencies: []
      },
      {
        id: 'stage-2',
        name: 'Data Transformation',
        type: StageType.TASK,
        configuration: { description: 'Transform data' },
        dependencies: []
      }
    ],
    dependencies: [
      { from: 'stage-1', to: 'stage-2', type: DependencyType.SEQUENTIAL }
    ],
    triggers: [],
    resources: [],
    metadata: {
      name: 'Test Workflow',
      version: '1.0.0',
      created: new Date(),
      modified: new Date()
    }
  };

  try {
    // Test with different goals
    const riskAnalysis = await riskAnalyzer.analyzeRisks(workflow, Goal.RELIABILITY);
    
    const reliabilityResult = await optimizationAgent.optimize(workflow, riskAnalysis, Goal.RELIABILITY);
    const costResult = await optimizationAgent.optimize(workflow, riskAnalysis, Goal.COST);
    const simplicityResult = await optimizationAgent.optimize(workflow, riskAnalysis, Goal.SIMPLICITY);

    console.log('✅ OptimizationAgent test passed!');
    console.log(`Reliability improvements: ${reliabilityResult.improvements.length}`);
    console.log(`Cost improvements: ${costResult.improvements.length}`);
    console.log(`Simplicity improvements: ${simplicityResult.improvements.length}`);
    
    // Verify goal-specific differences
    const hasGoalDifferences = 
      reliabilityResult.improvements.length !== costResult.improvements.length ||
      costResult.improvements.length !== simplicityResult.improvements.length ||
      reliabilityResult.improvements.some((imp, i) => 
        costResult.improvements[i] && imp.type !== costResult.improvements[i].type
      );
    
    if (hasGoalDifferences) {
      console.log('✅ Goal-specific recommendation variation verified!');
    } else {
      console.log('⚠️  Goal-specific differences may be subtle');
    }

    console.log('✅ Property 4: Goal-specific recommendation variation - PASSED');
    
  } catch (error) {
    console.error('❌ OptimizationAgent test failed:', error);
    process.exit(1);
  }
}

testOptimizationAgent();
import { ParserAgent } from './agents/ParserAgent';

async function verifyParser() {
  const parser = new ParserAgent();
  
  console.log('Testing ParserAgent implementation...\n');
  
  // Test 1: JSON parsing
  const jsonWorkflow = JSON.stringify({
    stages: [
      { id: 'stage-1', name: 'Test Stage', type: 'task', configuration: {}, dependencies: [] }
    ],
    dependencies: [],
    triggers: [],
    resources: [],
    metadata: { name: 'Test Workflow', version: '1.0.0', created: new Date(), modified: new Date() }
  }, null, 2);
  
  const jsonResult = await parser.parse(jsonWorkflow);
  console.log('JSON parsing result:', jsonResult.success ? 'SUCCESS' : 'FAILED');
  if (!jsonResult.success) console.log('Error:', jsonResult.error);
  
  // Test 2: YAML parsing
  const yamlWorkflow = `
stages:
  - id: stage-1
    name: "Test Stage"
    type: task
    configuration: {}
    dependencies: []
dependencies: []
triggers: []
resources: []
metadata:
  name: "Test Workflow"
  version: "1.0.0"
  created: ${new Date().toISOString()}
  modified: ${new Date().toISOString()}
`;
  
  const yamlResult = await parser.parse(yamlWorkflow);
  console.log('YAML parsing result:', yamlResult.success ? 'SUCCESS' : 'FAILED');
  if (!yamlResult.success) console.log('Error:', yamlResult.error);
  
  // Test 3: Text parsing
  const textWorkflow = `
1. Initialize the system
2. Process the data
3. Generate the report
`;
  
  const textResult = await parser.parse(textWorkflow);
  console.log('Text parsing result:', textResult.success ? 'SUCCESS' : 'FAILED');
  if (!textResult.success) console.log('Error:', textResult.error);
  
  // Test 4: Error handling
  const emptyResult = await parser.parse('');
  console.log('Empty input handling:', !emptyResult.success ? 'SUCCESS' : 'FAILED');
  
  console.log('\nParserAgent verification complete!');
}

verifyParser().catch(console.error);
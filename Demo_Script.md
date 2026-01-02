# Live Demo Script - Agentic Workflow Reviewer

## Pre-Demo Setup Checklist

### Technical Setup
- [ ] Application running at `http://localhost:3000`
- [ ] AI configuration properly set up (API key or local model)
- [ ] Browser window ready with application loaded
- [ ] Sample workflows prepared (see below)
- [ ] Network connectivity verified
- [ ] Screen sharing/projection tested

### Presentation Setup
- [ ] PowerPoint slides ready and tested
- [ ] Demo browser window positioned for easy switching
- [ ] Timer/stopwatch ready for performance demonstrations
- [ ] Backup slides ready in case of technical issues

## Demo Flow (5-7 minutes)

### 1. Application Overview (30 seconds)
**Script**: "Let me show you the Agentic Workflow Reviewer in action. This is a live web application built with Kiro that uses four specialized AI agents to analyze workflows."

**Actions**:
- Show the main interface at localhost:3000
- Point out the AI status indicator
- Highlight the clean, intuitive design

### 2. Sample Workflow Input (45 seconds)
**Script**: "I'll analyze a real CI/CD pipeline workflow. Notice how the system accepts multiple formats - JSON, YAML, or plain text."

**Sample CI/CD Workflow** (copy-paste ready):
```JSON
{
   "metadata":{
      "name":"CI Build and Test Pipeline",
      "version":"1.0.0",
      "description":"Continuous integration workflow for building, testing, and publishing application artifacts",
      "owner":"platform-engineering-team"
   },
   "triggers":[
      {
         "type":"event",
         "source":"Git",
         "event":"PullRequestCreated",
         "description":"Triggered when a new pull request is opened"
      }
   ],
   "stages":[
      {
         "id":"stage-1",
         "name":"Checkout Source Code",
         "type":"task",
         "service":"Git",
         "configuration":{
            "repository":"main-repo"
         },
         "dependencies":[
            
         ]
      },
      {
         "id":"stage-2",
         "name":"Install Dependencies",
         "type":"task",
         "service":"CI Runner",
         "configuration":{
            "cache":false
         },
         "dependencies":[
            "stage-1"
         ]
      },
      {
         "id":"stage-3",
         "name":"Run Unit Tests",
         "type":"task",
         "service":"CI Runner",
         "configuration":{
            "testType":"unit"
         },
         "dependencies":[
            "stage-2"
         ]
      },
      {
         "id":"stage-4",
         "name":"Run Integration Tests",
         "type":"task",
         "service":"CI Runner",
         "configuration":{
            "testType":"integration"
         },
         "dependencies":[
            "stage-3"
         ]
      },
      {
         "id":"stage-5",
         "name":"Build Artifact",
         "type":"task",
         "service":"Build System",
         "configuration":{
            "artifactType":"docker-image"
         },
         "dependencies":[
            "stage-4"
         ]
      },
      {
         "id":"stage-6",
         "name":"Publish Artifact",
         "type":"task",
         "service":"Artifact Registry",
         "configuration":{
            "registry":"internal-registry"
         },
         "dependencies":[
            "stage-5"
         ]
      }
   ],
   "resources":[
      {
         "type":"compute",
         "name":"ci-runner-pool"
      },
      {
         "type":"registry",
         "name":"internal-artifact-registry"
      }
   ]
}
```

**Actions**:
- Paste the workflow into the text area
- Select "Reliability" as the optimization goal
- Click "Review Workflow"

### 3. Multi-Agent Analysis in Action (90 seconds)
**Script**: "Watch as four specialized AI agents analyze this workflow in sequence. Each agent has a specific expertise."

**Narrate the agents as they execute**:
1. **Parser Agent**: "First, the Parser Agent extracts the workflow structure, identifying stages, dependencies, and triggers."
2. **Risk Analyzer Agent**: "Next, the Risk Analyzer identifies potential failure points and scaling issues."
3. **Optimization Agent**: "The Optimization Agent suggests improvements based on our Reliability goal."
4. **Critic Agent**: "Finally, the Critic Agent challenges assumptions and identifies potential overengineering."

**Actions**:
- Point out the progress indicators
- Note the analysis time (should be ~140ms for initial analysis)
- Highlight the organized results display

### 4. Results Exploration (60 seconds)
**Script**: "The results are organized into clear sections. Let me show you what each agent discovered."

**Walk through each tab**:
- **Risks**: "The Risk Analyzer found single points of failure and missing retry policies"
- **Bottlenecks**: "It identified potential scaling bottlenecks in the sequential job structure"
- **Missing Steps**: "Missing security scanning and proper error handling"
- **Improvements**: "Specific suggestions for parallel execution and better monitoring"

**Actions**:
- Click through each results tab
- Highlight specific recommendations
- Show the refined workflow comparison

### 5. Goal Change & Performance Demo (90 seconds)
**Script**: "Now here's where the agentic design really shines. Let me change the optimization goal from Reliability to Cost and watch the performance optimization in action."

**Actions**:
- Change goal from "Reliability" to "Cost" using the dropdown
- Start timer to show re-analysis speed
- Point out the "2.8x faster" performance indicator
- Note the cache hit indicators

**Script**: "Notice how the recommendations changed completely. The same workflow, but now optimized for cost reduction instead of reliability. And it was 2.8x faster because of intelligent caching."

**Show the differences**:
- Different risk priorities (cost-focused)
- Different optimization suggestions (resource efficiency)
- Different bottleneck analysis (cost implications)

### 6. Third Goal Demonstration (45 seconds)
**Script**: "Let me quickly show the third optimization goal - Simplicity."

**Actions**:
- Change goal to "Simplicity"
- Show even faster re-analysis (cached parsing + risk analysis)
- Highlight simplicity-focused recommendations

**Script**: "Now the agents focus on reducing complexity, minimizing dependencies, and improving maintainability. Three different perspectives on the same workflow."

### 7. Error Handling Demo (Optional - 30 seconds)
**Script**: "The system also handles errors gracefully. Let me show you what happens with invalid input."

**Actions**:
- Clear the workflow input
- Try to submit (shows validation error)
- Paste malformed JSON/YAML
- Show specific error messages with guidance

## Backup Demo Scenarios

### Scenario A: Network Issues
If AI services are unavailable:
- Show the error handling with retry options
- Explain the graceful degradation
- Use screenshots of successful analysis results

### Scenario B: Performance Issues
If analysis is slow:
- Explain the caching strategy
- Show cache statistics in development mode
- Use pre-recorded performance metrics

### Scenario C: Complex Workflow
Alternative complex workflow:
```yaml
metadata:
  name: Video Upload Processing Workflow
  version: 1.0.0
  description: Event-driven workflow for processing uploaded videos with timestamp overlay
  owner: media-platform-team
triggers:
  - type: event
    source: S3
    event: ObjectCreated
    description: Triggered when a new video is uploaded to the input bucket
stages:
  - id: stage-1
    name: Upload Video
    type: task
    service: S3
    configuration:
      bucket: raw-video-uploads
    dependencies: []
  - id: stage-2
    name: Send Metadata to Queue
    type: task
    service: SQS
    configuration:
      queue: video-processing-queue
      payload:
        - filePath
        - uploadTime
    dependencies:
      - stage-1
  - id: stage-3
    name: Trigger Processing
    type: task
    service: Lambda
    configuration:
      trigger: SQSMessageAvailable
    dependencies:
      - stage-2
  - id: stage-4
    name: Start Video Processing Task
    type: task
    service: ECS Fargate
    configuration:
      cpu: 1 vCPU
      memory: 2GB
    dependencies:
      - stage-3
  - id: stage-5
    name: Overlay Timestamp
    type: task
    service: FFmpeg
    configuration:
      overlay: recording_time
      font: default
    dependencies:
      - stage-4
  - id: stage-6
    name: Upload Processed Video
    type: task
    service: S3
    configuration:
      bucket: processed-videos
    dependencies:
      - stage-5
  - id: stage-7
    name: Update Status
    type: task
    service: Database
    configuration:
      status:
        - processing
        - completed
    dependencies:
      - stage-6
resources:
  - type: queue
    name: video-processing-queue
  - type: compute
    name: ecs-fargate-cluster

```

## Key Talking Points During Demo

### Agentic Design Emphasis
- "Four specialized agents, each with distinct expertise"
- "Sequential execution with data flow between agents"
- "Each agent builds on the previous agent's analysis"

### Kiro Integration Highlights
- "Built using Kiro's specs-driven development approach"
- "Property-based testing with 1000+ validations"
- "Intelligent caching provides real performance gains"

### Performance Metrics
- "Initial analysis: ~140ms"
- "Re-analysis: ~50ms (2.8x faster)"
- "Cache hit rate improves with usage"

### Real-World Value
- "Saves DevOps teams hours of manual review"
- "Multiple optimization perspectives in one tool"
- "Explains reasoning behind recommendations"

## Q&A Preparation

### Technical Questions
**Q**: "How do the agents communicate with each other?"
**A**: "Each agent receives structured output from the previous agent. The Parser provides WorkflowStructure, Risk Analyzer provides RiskAnalysis, and so on. The AnalysisEngine orchestrates this data flow."

**Q**: "What makes this 'agentic' vs just using one AI model?"
**A**: "Task decomposition is key. Each agent has specialized prompts and logic for its domain. The Parser focuses on structure extraction, Risk Analyzer on failure modes, etc. This provides better, more focused analysis than a single general-purpose model."

**Q**: "How does the caching work?"
**A**: "Component-level caching with TTL. Parse results are cached and reused across goal changes. Risk analysis and optimization results are cached per goal. This enables the 2.8x speedup for re-analysis."

### Kiro-Specific Questions
**Q**: "How did you use Kiro's features?"
**A**: "Comprehensive integration: specs for requirements tracking, property-based testing for correctness, agent orchestration for workflow management, and intelligent caching for performance."

**Q**: "What did you learn about Kiro?"
**A**: "Specs-driven development kept us organized. Property-based testing caught edge cases early. The incremental task approach with validation checkpoints was crucial for a complex multi-agent system."

### Implementation Questions
**Q**: "What were the biggest challenges?"
**A**: "State management across multiple agents was complex. Property-based testing with agent mocking proved challenging. Network error handling required several iterations to get right."

**Q**: "How would you scale this for production?"
**A**: "Phase 1 is internal tooling (current). Phase 2 adds CI/CD integrations. Phase 3 brings enterprise features. Phase 4 expands to Terraform and Kubernetes analysis."

## Success Metrics

### Demo Success Indicators
- [ ] Application loads and responds quickly
- [ ] All four agents execute successfully
- [ ] Performance improvement clearly visible
- [ ] Goal changes produce different recommendations
- [ ] Error handling demonstrates gracefully
- [ ] Audience engagement and questions

### Presentation Success Indicators
- [ ] Clear problem statement resonates
- [ ] Agentic design patterns well explained
- [ ] Kiro integration comprehensively shown
- [ ] Technical implementation demonstrates quality
- [ ] Real-world value proposition clear
- [ ] Honest reflection on learnings shared

## Post-Demo Actions

### Immediate Follow-up
- Share repository URL with audience
- Provide setup instructions for local testing
- Offer to discuss technical details offline
- Exchange contact information for collaboration

### Documentation Links
- GitHub repository: [Your repo URL]
- Live demo: [Deployment URL if available]
- Technical documentation: README.md
- Presentation slides: Available in repository

## Contingency Plans

### Technical Failures
1. **Application won't start**: Use screenshots and recorded demo
2. **AI services down**: Show error handling, use cached results
3. **Network issues**: Use offline mode, pre-recorded metrics
4. **Browser crashes**: Have backup browser window ready

### Time Management
- **Running long**: Skip error handling demo, focus on core functionality
- **Running short**: Add complexity demo with Kubernetes workflow
- **Questions during demo**: Note for Q&A, stay on script

### Audience Engagement
- **Low engagement**: Ask direct questions about their workflow challenges
- **High engagement**: Allow brief interruptions, note questions for later
- **Technical audience**: Dive deeper into implementation details
- **Business audience**: Focus more on value proposition and ROI

Remember: The goal is to demonstrate a working, valuable solution built with Kiro that showcases agentic design patterns and real-world applicability. Keep the energy high and the technical details accessible!
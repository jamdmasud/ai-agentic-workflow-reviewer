'use client'

import React, { useState, useEffect } from 'react'
import { 
  Container, 
  Title, 
  Text, 
  Paper, 
  Group, 
  Badge, 
  Stack, 
  Alert,
  Button,
  Loader,
  Grid,
  Card,
  Progress,
  ActionIcon,
  Notification,
  Modal
} from '@mantine/core'
import { 
  IconRocket, 
  IconClock, 
  IconBolt, 
  IconX, 
  IconCheck, 
  IconAlertTriangle, 
  IconInfoCircle,
  IconRefresh,
  IconRobot
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useApplicationState } from '../hooks/useApplicationState'
import WorkflowInputForm from '../components/WorkflowInputForm'
import GoalSelector from '../components/GoalSelector'
import { AIConfigurationPanel } from '../components/AIConfigurationPanel'
import { AIResultsDisplay } from '../components/AIResultsDisplay'
import { useAIAnalysis, useAIConfigPersistence } from '../hooks/useAIAnalysis'
import { Goal } from '../types/goals'
import { AIAgentConfig } from '../agents/AIAgent'

// Create a singleton instance of the analysis service - no longer needed for AI-only app

export default function Home() {
  const { state, actions } = useApplicationState()
  const [aiConfigModalOpen, setAiConfigModalOpen] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIAgentConfig | null>(null)
  
  // AI Analysis hooks
  const { loadConfig, saveConfig } = useAIConfigPersistence()
  const aiAnalysis = useAIAnalysis()

  // Load AI config on client side only
  useEffect(() => {
    const config = loadConfig()
    setAiConfig(config)
    aiAnalysis.updateAIConfig(config)
  }, []) // Remove dependencies to prevent infinite loop

  const handleWorkflowSubmit = async (workflow: string, goal: Goal) => {
    try {
      // Clear any previous results
      aiAnalysis.clearResults()
      actions.setValidationError(null)
      actions.setAnalysisError('')
      
      // Set workflow input and goal
      actions.setWorkflowInput(workflow)
      actions.setGoal(goal)
      actions.startAnalysis()

      console.log('Starting AI analysis...')
      
      // Perform AI analysis and get results directly
      const analysisResults = await aiAnalysis.analyzeWorkflow(workflow, goal)
      
      console.log('AI analysis completed. Direct results:', {
        hasResults: !!analysisResults,
        aiStateResults: !!aiAnalysis.state.results,
        aiStateError: !!aiAnalysis.state.error
      })
      
      // Use the directly returned results instead of checking state
      if (analysisResults) {
        console.log('Setting analysis results from direct return...')
        actions.setAnalysisResults(analysisResults)
        actions.completeAnalysis()
        notifications.show({
          title: 'AI Analysis Complete!',
          message: 'Advanced AI agents have analyzed your workflow!',
          color: 'green',
          icon: <IconCheck size={16} />
        })
      } else if (aiAnalysis.state.error) {
        console.log('AI analysis had error:', aiAnalysis.state.error)
        actions.setAnalysisError(aiAnalysis.state.error)
        actions.completeAnalysis()
        notifications.show({
          title: 'AI Analysis Failed',
          message: aiAnalysis.state.error,
          color: 'red',
          icon: <IconX size={16} />
        })
      } else {
        console.log('AI analysis completed but no results returned')
        actions.completeAnalysis()
        notifications.show({
          title: 'AI Analysis Incomplete',
          message: 'AI analysis completed but no results were returned',
          color: 'yellow',
          icon: <IconAlertTriangle size={16} />
        })
      }
      
    } catch (error) {
      console.error('Exception in handleWorkflowSubmit:', error)
      const errorMessage = error instanceof Error ? error.message : 'AI analysis failed'
      actions.setAnalysisError(errorMessage)
      actions.completeAnalysis()
      notifications.show({
        title: 'AI Connection Error',
        message: `Failed to connect to AI service: ${errorMessage}`,
        color: 'red',
        icon: <IconX size={16} />
      })
    }
  }

  const handleAIConfigChange = (config: AIAgentConfig) => {
    setAiConfig(config)
    aiAnalysis.updateAIConfig(config)
    saveConfig(config)
  }

  const handleGoalChange = async (newGoal: Goal) => {
    if (newGoal === state.analysis.currentGoal || !state.workflow.originalInput) {
      return
    }

    try {
      const oldGoal = state.analysis.currentGoal
      actions.setGoal(newGoal)
      actions.startReanalysis()

      // Re-run AI analysis with new goal and get results directly
      const analysisResults = await aiAnalysis.analyzeWorkflow(state.workflow.originalInput, newGoal)
      
      if (analysisResults) {
        actions.setAnalysisResults(analysisResults)
        actions.completeReanalysis()
        
        notifications.show({
          title: 'AI Re-analysis Complete!',
          message: `AI analysis completed with ${newGoal} goal!`,
          color: 'green',
          icon: <IconCheck size={16} />
        })
      } else if (aiAnalysis.state.error) {
        actions.setAnalysisError(aiAnalysis.state.error)
        actions.completeReanalysis()
        notifications.show({
          title: 'AI Re-analysis Failed',
          message: aiAnalysis.state.error,
          color: 'red',
          icon: <IconX size={16} />
        })
      } else {
        actions.completeReanalysis()
        notifications.show({
          title: 'AI Re-analysis Incomplete',
          message: 'AI re-analysis completed but no results were returned',
          color: 'yellow',
          icon: <IconAlertTriangle size={16} />
        })
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Re-analysis failed'
      actions.setAnalysisError(errorMessage)
      actions.completeReanalysis()
      notifications.show({
        title: 'AI Connection Error',
        message: `Failed to connect to AI service: ${errorMessage}`,
        color: 'red',
        icon: <IconX size={16} />
      })
    }
  }

  return (
    <Container size="xl" py="xl">
      {/* Header Section */}
      <Paper shadow="sm" p="xl" mb="xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Group justify="space-between" mb="md">
          <div />
          <Group>
            <IconRocket size={48} color="white" />
          </Group>
          <Group>
            <ActionIcon
              variant="subtle"
              color="white"
              size="lg"
              onClick={() => setAiConfigModalOpen(true)}
              title="AI Configuration"
            >
              <IconRobot size={24} />
            </ActionIcon>
          </Group>
        </Group>
        <Title order={1} ta="center" c="white" mb="sm">
          AI Workflow Reviewer
        </Title>
        <Text ta="center" c="white" size="lg" mb="md">
          AI-powered intelligent workflow analysis and optimization
        </Text>
        
        {/* AI Status Indicator */}
        <Group justify="center" mb="md">
          <Badge 
            color={aiConfig && (aiAnalysis.getAIConfig().provider === 'local' || aiConfig.apiKey) ? 'green' : 'yellow'} 
            variant="filled"
            leftSection={<IconRobot size={12} />}
          >
            AI: {aiConfig ? (aiAnalysis.getAIConfig().provider || 'Not configured') : 'Loading...'}
          </Badge>
        </Group>
        
        {/* Performance Metrics Display */}
        {state.analysis.performanceMetrics && (
          <Group justify="center" gap="xl">
            <Group gap="xs">
              <IconClock size={16} color="white" />
              <Text c="white" size="sm">
                Analysis time: {state.analysis.performanceMetrics.analysisTimeMs}ms
              </Text>
            </Group>
            {state.analysis.performanceMetrics.fromCache && (
              <Group gap="xs">
                <IconBolt size={16} color="#90EE90" />
                <Text c="#90EE90" size="sm" fw={500}>
                  {Math.round(state.analysis.performanceMetrics.performanceGain)}% faster (cached)
                </Text>
              </Group>
            )}
          </Group>
        )}
      </Paper>

      <Stack gap="xl">
        {/* Debug info - remove in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <Alert color="gray" variant="light" mb="md">
            <Text size="xs">
              Debug - App State: isAnalyzing: {state.analysis.isAnalyzing.toString()}, 
              showResults: {state.ui.showResults.toString()}, 
              hasResults: {(!!state.analysis.results).toString()}, 
              hasAIResults: {(!!aiAnalysis.state.results).toString()}
            </Text>
          </Alert>
        )} */}

        {/* Input Form */}
        <WorkflowInputForm
          onSubmit={handleWorkflowSubmit}
          isAnalyzing={state.analysis.isAnalyzing}
          validationError={state.analysis.validationError || undefined}
          validationGuidance={state.analysis.validationGuidance || undefined}
          aiConfigured={!!(aiConfig && (aiAnalysis.getAIConfig().provider === 'local' || aiConfig.apiKey))}
        />

        {/* Goal Selector - Show after initial analysis */}
        {state.ui.showResults && state.analysis.results && (
          <GoalSelector
            currentGoal={state.analysis.currentGoal}
            onGoalChange={handleGoalChange}
            isReanalyzing={state.analysis.isReanalyzing}
            disabled={state.analysis.isAnalyzing}
          />
        )}

        {/* Results Display */}
        {state.ui.showResults && state.analysis.results && aiAnalysis.state.results && (
          <AIResultsDisplay
            results={aiAnalysis.state.results as any}
            executedAgents={aiAnalysis.state.executedAgents}
            failedAgents={aiAnalysis.state.failedAgents}
            fromCache={false}
            performanceGain={aiAnalysis.state.performanceGain}
          />
        )}

        {/* Error Display */}
        {state.analysis.error && (
          <Alert 
            variant="light" 
            color="red" 
            title="Analysis Error"
            icon={<IconAlertTriangle size={16} />}
          >
            <Text mb="md">{state.analysis.error}</Text>
            
            {/* Show retry button for network errors */}
            {state.analysis.error.includes('Network') && (
              <Button
                leftSection={<IconRefresh size={16} />}
                variant="light"
                color="red"
                onClick={() => {
                  if (state.workflow.originalInput) {
                    handleWorkflowSubmit(state.workflow.originalInput, state.analysis.currentGoal)
                  }
                }}
              >
                Retry AI Analysis
              </Button>
            )}
          </Alert>
        )}

        {/* Cache Statistics (for development/debugging) */}
        {process.env.NODE_ENV === 'development' && state.analysis.cacheStats && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Cache Statistics</Text>
              <Badge color="blue" variant="light">
                Development
              </Badge>
            </Group>
            
            <Grid>
              <Grid.Col span={3}>
                <Text size="sm" c="dimmed">Entries</Text>
                <Text fw={500}>{state.analysis.cacheStats.totalEntries}</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" c="dimmed">Hit Rate</Text>
                <Text fw={500}>{Math.round(state.analysis.cacheStats.hitRate * 100)}%</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" c="dimmed">Total Hits</Text>
                <Text fw={500}>{state.analysis.cacheStats.totalHits}</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" c="dimmed">Total Misses</Text>
                <Text fw={500}>{state.analysis.cacheStats.totalMisses}</Text>
              </Grid.Col>
            </Grid>
          </Card>
        )}
      </Stack>

      {/* AI Configuration Modal */}
      <Modal
        opened={aiConfigModalOpen}
        onClose={() => setAiConfigModalOpen(false)}
        title="AI Configuration"
        size="lg"
        centered
      >
        <AIConfigurationPanel
          config={aiConfig || {}}
          onConfigChange={handleAIConfigChange}
          onTestConnection={aiAnalysis.testAIConnection}
        />
      </Modal>
    </Container>
  )
}
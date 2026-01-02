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
  IconSettings,
  IconRobot
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useApplicationState } from '../hooks/useApplicationState'
import { WorkflowAnalysisService } from '../orchestration/WorkflowAnalysisService'
import WorkflowInputForm from '../components/WorkflowInputForm'
import ResultsDisplay from '../components/ResultsDisplay'
import GoalSelector from '../components/GoalSelector'
import { AIConfigurationPanel } from '../components/AIConfigurationPanel'
import { AIResultsDisplay } from '../components/AIResultsDisplay'
import { useAIAnalysis, useAIConfigPersistence } from '../hooks/useAIAnalysis'
import { Goal } from '../types/goals'
import { NotificationType } from '../types/state'
import { AIAgentConfig } from '../agents/AIAgent'

// Create a singleton instance of the analysis service
const analysisService = new WorkflowAnalysisService()

export default function Home() {
  const { state, actions } = useApplicationState()
  const [aiConfigModalOpen, setAiConfigModalOpen] = useState(false)
  const [lastAnalysisWasAI, setLastAnalysisWasAI] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // AI Analysis hooks
  const { loadConfig, saveConfig } = useAIConfigPersistence()
  const aiAnalysis = useAIAnalysis()

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
    // Load config only once when component mounts
    try {
      const config = loadConfig()
      aiAnalysis.updateAIConfig(config)
    } catch (error) {
      console.warn('Failed to load AI config:', error)
    }
  }, [])

  const handleAIWorkflowSubmit = async (workflow: string, goal: Goal) => {
    setLastAnalysisWasAI(true)
    try {
      // Clear any previous results
      aiAnalysis.clearResults()
      actions.setValidationError(null)
      actions.setAnalysisError('')
      
      // Set workflow input and goal
      actions.setWorkflowInput(workflow)
      actions.setGoal(goal)
      actions.startAnalysis()

      // Perform AI analysis
      await aiAnalysis.analyzeWorkflow(workflow, goal)
      
      if (aiAnalysis.state.results) {
        // Convert AI results to match existing interface
        actions.setAnalysisResults(aiAnalysis.state.results)
        actions.completeAnalysis()
        notifications.show({
          title: 'AI Analysis Complete!',
          message: 'Advanced AI agents have analyzed your workflow!',
          color: 'green',
          icon: <IconCheck size={16} />
        })
      } else if (aiAnalysis.state.error) {
        actions.setAnalysisError(aiAnalysis.state.error)
        actions.completeAnalysis()
        notifications.show({
          title: 'AI Analysis Failed',
          message: aiAnalysis.state.error,
          color: 'red',
          icon: <IconX size={16} />
        })
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI analysis failed'
      actions.setAnalysisError(errorMessage)
      actions.completeAnalysis()
      notifications.show({
        title: 'Error',
        message: `AI analysis failed: ${errorMessage}`,
        color: 'red',
        icon: <IconX size={16} />
      })
    }
  }

  const handleAIConfigChange = (config: AIAgentConfig) => {
    aiAnalysis.updateAIConfig(config)
    saveConfig(config)
  }

  const handleWorkflowSubmit = async (workflow: string, goal: Goal) => {
    setLastAnalysisWasAI(false)
    try {
      // Clear any previous validation errors
      actions.setValidationError(null)
      actions.setAnalysisError('')
      
      // Set workflow input and goal
      actions.setWorkflowInput(workflow)
      actions.setGoal(goal)
      actions.startAnalysis()

      // Perform analysis using the service
      const result = await analysisService.analyzeWorkflow(workflow, goal)
      
      // Update performance metrics
      actions.setPerformanceMetrics(result.performanceMetrics)
      
      if (result.success && result.data) {
        // Update state with results
        actions.setAnalysisResults(result.data)
        actions.completeAnalysis()
        notifications.show({
          title: 'Success!',
          message: 'Workflow analysis completed successfully!',
          color: 'green',
          icon: <IconCheck size={16} />
        })
      } else {
        // Handle validation errors vs analysis errors
        if (result.failedAgents.includes('Validation')) {
          actions.setValidationError(result.error || 'Validation failed', result.guidance)
          actions.completeAnalysis()
        } else {
          // Handle partial results or analysis failure
          const errorMessage = result.error || 'Analysis failed'
          actions.setAnalysisError(errorMessage)
          actions.completeAnalysis()
          
          if (result.partialResults) {
            actions.setAnalysisResults(result.partialResults as any)
            notifications.show({
              title: 'Warning',
              message: `Analysis completed with warnings: ${errorMessage}`,
              color: 'yellow',
              icon: <IconAlertTriangle size={16} />
            })
          } else {
            notifications.show({
              title: 'Error',
              message: `Analysis failed: ${errorMessage}`,
              color: 'red',
              icon: <IconX size={16} />
            })
          }
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
      actions.setAnalysisError(errorMessage)
      actions.completeAnalysis()
      notifications.show({
        title: 'Error',
        message: `Analysis failed: ${errorMessage}`,
        color: 'red',
        icon: <IconX size={16} />
      })
    }
  }

  const handleGoalChange = async (newGoal: Goal) => {
    if (newGoal === state.analysis.currentGoal || !state.workflow.originalInput) {
      return
    }

    try {
      const oldGoal = state.analysis.currentGoal
      actions.setGoal(newGoal)
      actions.startReanalysis()

      // Re-run analysis with new goal using optimized re-analysis
      const result = await analysisService.reanalyzeWithNewGoal(
        state.workflow.originalInput, 
        oldGoal, 
        newGoal
      )
      
      // Update performance metrics
      actions.setPerformanceMetrics(result.performanceMetrics)
      
      if (result.success && result.data) {
        actions.setAnalysisResults(result.data)
        actions.completeReanalysis()
        
        // Show performance gain if applicable
        const performanceMessage = result.performanceMetrics.performanceGain > 0
          ? `Re-analysis completed with ${newGoal} goal! (${Math.round(result.performanceMetrics.performanceGain)}% faster)`
          : `Re-analysis completed with ${newGoal} goal!`
        
        notifications.show({
          title: 'Re-analysis Complete!',
          message: performanceMessage,
          color: 'green',
          icon: <IconCheck size={16} />
        })
      } else {
        const errorMessage = result.error || 'Re-analysis failed'
        actions.setAnalysisError(errorMessage)
        actions.completeReanalysis()
        
        if (result.partialResults) {
          actions.setAnalysisResults(result.partialResults as any)
          notifications.show({
            title: 'Warning',
            message: `Re-analysis completed with warnings: ${errorMessage}`,
            color: 'yellow',
            icon: <IconAlertTriangle size={16} />
          })
        } else {
          notifications.show({
            title: 'Error',
            message: `Re-analysis failed: ${errorMessage}`,
            color: 'red',
            icon: <IconX size={16} />
          })
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Re-analysis failed'
      actions.setAnalysisError(errorMessage)
      actions.completeReanalysis()
      notifications.show({
        title: 'Error',
        message: `Re-analysis failed: ${errorMessage}`,
        color: 'red',
        icon: <IconX size={16} />
      })
    }
  }

  // Get current AI config safely
  const getCurrentAIConfig = () => {
    if (!mounted) return { provider: 'loading' }
    try {
      return aiAnalysis.getAIConfig()
    } catch {
      return { provider: 'error' }
    }
  }

  const isAIConfigured = () => {
    if (!mounted) return false
    try {
      const config = loadConfig()
      const currentConfig = aiAnalysis.getAIConfig()
      return currentConfig.provider === 'local' || !!config.apiKey
    } catch {
      return false
    }
  }

  const getAIConfigForModal = () => {
    if (!mounted) return {}
    try {
      return loadConfig()
    } catch {
      return {}
    }
  }

  if (!mounted) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" />
          <Text>Loading...</Text>
        </Group>
      </Container>
    )
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
            <ActionIcon
              variant="subtle"
              color="white"
              size="lg"
              onClick={() => setAiConfigModalOpen(true)}
              title="Settings"
            >
              <IconSettings size={24} />
            </ActionIcon>
          </Group>
        </Group>
        <Title order={1} ta="center" c="white" mb="sm">
          Agentic Workflow Reviewer
        </Title>
        <Text ta="center" c="white" size="lg" mb="md">
          AI-powered workflow analysis and optimization system
        </Text>
        
        {/* AI Status Indicator */}
        <Group justify="center" mb="md">
          <Badge 
            color={isAIConfigured() ? 'green' : 'yellow'} 
            variant="filled"
            leftSection={<IconRobot size={12} />}
          >
            AI: {getCurrentAIConfig().provider || 'Not configured'}
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
        {/* Input Form */}
        <WorkflowInputForm
          onSubmit={handleWorkflowSubmit}
          onAISubmit={handleAIWorkflowSubmit}
          isAnalyzing={state.analysis.isAnalyzing}
          validationError={state.analysis.validationError || undefined}
          validationGuidance={state.analysis.validationGuidance || undefined}
          aiConfigured={isAIConfigured()}
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
        {state.ui.showResults && state.analysis.results && (
          lastAnalysisWasAI && aiAnalysis.state.results ? (
            <AIResultsDisplay
              results={aiAnalysis.state.results as any}
              executedAgents={aiAnalysis.state.executedAgents}
              failedAgents={aiAnalysis.state.failedAgents}
              fromCache={false}
              performanceGain={aiAnalysis.state.performanceGain}
            />
          ) : (
            <ResultsDisplay
              results={state.analysis.results}
              originalWorkflow={state.workflow.originalInput}
              isUpdating={state.analysis.isReanalyzing}
            />
          )
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
                Retry Analysis
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
          config={getAIConfigForModal()}
          onConfigChange={handleAIConfigChange}
          onTestConnection={aiAnalysis.testAIConnection}
        />
      </Modal>
    </Container>
  )
}
'use client'

import React, { useState } from 'react'
import { 
  Paper, 
  Title, 
  Textarea, 
  Select, 
  Button, 
  Alert, 
  Group, 
  Text, 
  Stack,
  Grid,
  Code,
  Badge
} from '@mantine/core'
import { IconAlertCircle, IconRobot, IconCode } from '@tabler/icons-react'
import { Goal, GOAL_OPTIONS } from '../types/goals'

interface WorkflowInputFormProps {
  onSubmit: (workflow: string, goal: Goal) => void
  isAnalyzing?: boolean
  validationError?: string
  validationGuidance?: string
  aiConfigured?: boolean
}

export default function WorkflowInputForm({ 
  onSubmit, 
  isAnalyzing = false, 
  validationError: externalValidationError,
  validationGuidance: externalValidationGuidance,
  aiConfigured = false
}: WorkflowInputFormProps) {
  const [workflow, setWorkflow] = useState('')
  const [selectedGoal, setSelectedGoal] = useState<Goal>(Goal.RELIABILITY)
  const [localValidationError, setLocalValidationError] = useState('')

  // Use external validation error if provided, otherwise use local
  const validationError = externalValidationError || localValidationError
  const validationGuidance = externalValidationGuidance

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous validation errors
    setLocalValidationError('')
    
    // Basic client-side validation
    if (!workflow.trim()) {
      setLocalValidationError('Please enter a workflow configuration before submitting.')
      return
    }
    
    // Always use AI analysis
    onSubmit(workflow.trim(), selectedGoal)
  }

  const handleWorkflowChange = (value: string) => {
    setWorkflow(value)
    // Clear validation errors when user starts typing
    if (localValidationError) {
      setLocalValidationError('')
    }
  }

  return (
    <Paper shadow="md" p="xl" radius="md">
      <Group mb="lg">
        <IconRobot size={24} />
        <Title order={2}>Submit Workflow for AI Analysis</Title>
      </Group>
      
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          {/* Workflow Input Text Area */}
          <div>
            <Textarea
              label="Workflow Configuration"
              description="Enter your workflow configuration - AI agents will analyze it for optimization opportunities"
              placeholder="Enter your workflow configuration here..."
              value={workflow}
              onChange={(e) => handleWorkflowChange(e.currentTarget.value)}
              minRows={12}
              maxRows={20}
              autosize
              disabled={isAnalyzing}
              error={validationError}
              styles={{
                input: {
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }
              }}
            />
            
            {/* Guidance Message */}
            {validationGuidance && (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                title="Validation Guidance" 
                color="red" 
                mt="sm"
              >
                <Code block mt="xs" style={{ whiteSpace: 'pre-wrap' }}>
                  {validationGuidance}
                </Code>
              </Alert>
            )}

            {/* Format Examples (shown when no error) */}
            {!validationError && (
              <Grid mt="sm">
                <Grid.Col span={4}>
                  <Paper p="xs" bg="gray.0" radius="sm">
                    <Group gap="xs" mb="xs">
                      <Badge size="xs" variant="light">JSON</Badge>
                    </Group>
                    <Code fz="xs">{"{"}"stages": [...]{"}"}</Code>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Paper p="xs" bg="gray.0" radius="sm">
                    <Group gap="xs" mb="xs">
                      <Badge size="xs" variant="light">YAML</Badge>
                    </Group>
                    <Code fz="xs">stages: - name: ...</Code>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Paper p="xs" bg="gray.0" radius="sm">
                    <Group gap="xs" mb="xs">
                      <Badge size="xs" variant="light">Text</Badge>
                    </Group>
                    <Code fz="xs">Step 1: Build app</Code>
                  </Paper>
                </Grid.Col>
              </Grid>
            )}
          </div>

          {/* Goal Selection Dropdown */}
          <Select
            label="AI Optimization Goal"
            description="Select the primary goal for AI-powered workflow optimization"
            value={selectedGoal}
            onChange={(value) => setSelectedGoal(value as Goal)}
            data={GOAL_OPTIONS.map((option) => ({
              value: option.value,
              label: `${option.label} - ${option.description}`
            }))}
            disabled={isAnalyzing}
          />

          {/* AI Status Alert */}
          {!aiConfigured && (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
              <Text size="sm">
                AI analysis requires configuration. Click the AI settings button in the header to configure your AI provider.
              </Text>
            </Alert>
          )}

          {aiConfigured && (
            <Alert icon={<IconRobot size={16} />} color="blue" variant="light">
              <Text size="sm">
                AI agents will provide intelligent analysis including pattern recognition, 
                critical thinking, and advanced optimization suggestions.
              </Text>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            leftSection={<IconRobot size={20} />}
            disabled={isAnalyzing || !!validationError || !aiConfigured}
            loading={isAnalyzing}
            fullWidth
            gradient={{ from: 'violet', to: 'blue', deg: 90 }}
          >
            {isAnalyzing ? 'AI Analyzing Workflow...' : 'AI Review Workflow'}
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}
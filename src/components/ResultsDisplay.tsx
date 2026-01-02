'use client'

import React from 'react'
import { 
  Paper, 
  Title, 
  Text, 
  Badge, 
  Group, 
  Stack, 
  Card, 
  Grid, 
  Alert,
  Loader,
  Code,
  Tabs,
  List,
  Progress,
  Divider
} from '@mantine/core'
import { 
  IconShield, 
  IconBottle, 
  IconListCheck, 
  IconTrendingUp, 
  IconAlertTriangle,
  IconInfoCircle,
  IconTarget,
  IconCode,
  IconFileText
} from '@tabler/icons-react'
import { AnalysisResults, Risk, Bottleneck, MissingStep, Improvement, Severity, Priority } from '../types/analysis'
import { WorkflowStructure } from '../types/workflow'

interface ResultsDisplayProps {
  results: AnalysisResults
  originalWorkflow: string
  isUpdating?: boolean
}

export default function ResultsDisplay({ results, originalWorkflow, isUpdating = false }: ResultsDisplayProps) {
  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case Severity.CRITICAL: return 'red'
      case Severity.HIGH: return 'orange'
      case Severity.MEDIUM: return 'yellow'
      case Severity.LOW: return 'green'
      default: return 'gray'
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL: return 'red'
      case Priority.HIGH: return 'orange'
      case Priority.MEDIUM: return 'yellow'
      case Priority.LOW: return 'green'
      default: return 'gray'
    }
  }

  const formatWorkflowStructure = (workflow: WorkflowStructure): string => {
    return JSON.stringify(workflow, null, 2)
  }

  if (isUpdating) {
    return (
      <Alert 
        icon={<Loader size={16} />} 
        title="Updating Analysis" 
        color="blue"
      >
        <Text>Updating analysis results...</Text>
      </Alert>
    )
  }

  const totalFindings = results.risks.length + results.bottlenecks.length + results.missingSteps.length + results.improvements.length

  return (
    <Stack gap="xl">
      {/* Analysis Results Header */}
      <Paper shadow="md" p="xl" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={2}>Analysis Results</Title>
          <Group>
            <Badge size="lg" variant="light" color="blue">
              Confidence: {Math.round(results.confidence * 100)}%
            </Badge>
            <Badge size="lg" variant="light" color="gray">
              {totalFindings} findings
            </Badge>
          </Group>
        </Group>
        <Progress 
          value={results.confidence * 100} 
          color="blue" 
          size="lg" 
          radius="md"
        />
        <Text ta="center" size="sm" mt="xs">
          {Math.round(results.confidence * 100)}% confidence
        </Text>
      </Paper>

      <Grid>
        {/* Risks Section */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" h="100%">
            <Group mb="md">
              <IconShield size={24} color="red" />
              <Title order={3}>Risks</Title>
              <Badge color="red" variant="light">{results.risks.length}</Badge>
            </Group>
            
            {results.risks.length === 0 ? (
              <Text c="dimmed">No significant risks identified.</Text>
            ) : (
              <Stack gap="md">
                {results.risks.map((risk, index) => (
                  <Card key={index} withBorder padding="md" radius="sm">
                    <Group justify="space-between" mb="xs">
                      <Text fw={500} size="sm">
                        {risk.type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Badge color={getSeverityColor(risk.severity)} size="sm">
                        {risk.severity.toUpperCase()}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mb="xs">
                      {risk.description}
                    </Text>
                    <Text size="xs" c="dimmed" mb="xs">
                      <strong>Affected:</strong> {risk.affectedStages.join(', ')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        {/* Bottlenecks Section */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" h="100%">
            <Group mb="md">
              <IconBottle size={24} color="orange" />
              <Title order={3}>Bottlenecks</Title>
              <Badge color="orange" variant="light">{results.bottlenecks.length}</Badge>
            </Group>
            
            {results.bottlenecks.length === 0 ? (
              <Text c="dimmed">No bottlenecks identified.</Text>
            ) : (
              <Stack gap="md">
                {results.bottlenecks.map((bottleneck, index) => (
                  <Card key={index} withBorder padding="md" radius="sm">
                    <Group justify="space-between" mb="xs">
                      <Text fw={500} size="sm">
                        {bottleneck.type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Badge color={getSeverityColor(bottleneck.impact as any)} size="sm">
                        {bottleneck.impact.toUpperCase()}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mb="xs">
                      {bottleneck.description}
                    </Text>
                    <Text size="xs" c="dimmed" mb="xs">
                      <strong>Affected:</strong> {bottleneck.affectedStages.join(', ')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      <strong>Suggestions:</strong>
                    </Text>
                    <List size="xs" spacing="xs">
                      {bottleneck.suggestions.map((suggestion, idx) => (
                        <List.Item key={idx}>{suggestion}</List.Item>
                      ))}
                    </List>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        {/* Missing Steps Section */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" h="100%">
            <Group mb="md">
              <IconListCheck size={24} color="yellow" />
              <Title order={3}>Missing Steps</Title>
              <Badge color="yellow" variant="light">{results.missingSteps.length}</Badge>
            </Group>
            
            {results.missingSteps.length === 0 ? (
              <Text c="dimmed">No missing steps identified.</Text>
            ) : (
              <Stack gap="md">
                {results.missingSteps.map((step, index) => (
                  <Card key={index} withBorder padding="md" radius="sm">
                    <Group justify="space-between" mb="xs">
                      <Text fw={500} size="sm">
                        {step.type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Badge color={getPriorityColor(step.priority)} size="sm">
                        {step.priority.toUpperCase()}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mb="xs">
                      {step.description}
                    </Text>
                    <Text size="xs" c="dimmed" mb="xs">
                      <strong>Location:</strong> {step.suggestedLocation}
                    </Text>
                    <Text size="xs" c="dimmed">
                      <strong>Implementation:</strong> {step.implementation}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        {/* Improvements Section */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" h="100%">
            <Group mb="md">
              <IconTrendingUp size={24} color="green" />
              <Title order={3}>Improvements</Title>
              <Badge color="green" variant="light">{results.improvements.length}</Badge>
            </Group>
            
            {results.improvements.length === 0 ? (
              <Text c="dimmed">No improvements suggested.</Text>
            ) : (
              <Stack gap="md">
                {results.improvements.map((improvement, index) => (
                  <Card key={index} withBorder padding="md" radius="sm">
                    <Group justify="space-between" mb="xs">
                      <Text fw={500} size="sm">
                        {improvement.type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Group gap="xs">
                        <Badge color={getPriorityColor(improvement.priority)} size="sm">
                          {improvement.priority.toUpperCase()}
                        </Badge>
                        <Badge color="blue" size="sm" variant="light">
                          {Math.round(improvement.goalAlignment * 100)}%
                        </Badge>
                      </Group>
                    </Group>
                    <Text size="sm" c="dimmed" mb="xs">
                      {improvement.description}
                    </Text>
                    <Text size="xs" c="dimmed" mb="xs">
                      <strong>Implementation:</strong> {improvement.implementation}
                    </Text>
                    {improvement.tradeoffs.length > 0 && (
                      <>
                        <Text size="xs" c="dimmed">
                          <strong>Trade-offs:</strong>
                        </Text>
                        <List size="xs" spacing="xs">
                          {improvement.tradeoffs.map((tradeoff, idx) => (
                            <List.Item key={idx}>{tradeoff}</List.Item>
                          ))}
                        </List>
                      </>
                    )}
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Workflow Comparison */}
      <Paper shadow="md" p="xl" radius="md">
        <Group mb="lg">
          <IconCode size={24} />
          <Title order={3}>Workflow Comparison</Title>
        </Group>
        
        <Tabs defaultValue="original" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="original" leftSection={<IconFileText size={16} />}>
              Original Workflow
            </Tabs.Tab>
            <Tabs.Tab value="refined" leftSection={<IconTarget size={16} />}>
              Refined Workflow
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="original" pt="md">
            <Code block style={{ maxHeight: '400px', overflow: 'auto' }}>
              {originalWorkflow}
            </Code>
          </Tabs.Panel>

          <Tabs.Panel value="refined" pt="md">
            <Code block style={{ maxHeight: '400px', overflow: 'auto' }}>
              {formatWorkflowStructure(results.refinedWorkflow)}
            </Code>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  )
}
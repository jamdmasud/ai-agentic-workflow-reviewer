import React, { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Stack,
  Tabs,
  Alert,
  Progress,
  Accordion,
  List,
  ThemeIcon,
  Divider,
  Button,
  Collapse,
  ActionIcon,
  Tooltip,
  Code,
  Card
} from '@mantine/core';
import {
  IconShield,
  IconBottle,
  IconBulb,
  IconAlertTriangle,
  IconRobot,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconClock,
  IconBrain,
  IconTarget,
  IconQuestionMark
} from '@tabler/icons-react';
import { AnalysisResults, Risk, Bottleneck, Improvement, Priority, Severity } from '../types/analysis';
import { CounterArgument, ChallengedAssumption, OverengineeringDetection, AlternativePerspective } from '../agents/CriticAgent';

interface AIResultsDisplayProps {
  results: AnalysisResults & {
    aiInsights?: {
      optimizationAnalysis?: string;
      riskAnalysis?: string;
      criticismAnalysis?: string;
      overallConfidence?: number;
    };
    counterArguments?: CounterArgument[];
    challengedAssumptions?: ChallengedAssumption[];
    overengineeringDetections?: OverengineeringDetection[];
    alternativePerspectives?: AlternativePerspective[];
  };
  executedAgents: string[];
  failedAgents: string[];
  fromCache: boolean;
  performanceGain: number;
}

export function AIResultsDisplay({
  results,
  executedAgents,
  failedAgents,
  fromCache,
  performanceGain
}: AIResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSeverityColor = (severity: Severity | Priority | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case Severity.CRITICAL:
      case Priority.CRITICAL:
      case 'high':
        return 'red';
      case Severity.HIGH:
      case Priority.HIGH:
        return 'orange';
      case Severity.MEDIUM:
      case Priority.MEDIUM:
      case 'medium':
        return 'yellow';
      case Severity.LOW:
      case Priority.LOW:
      case 'low':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  const hasAIInsights = results.aiInsights && (
    results.aiInsights.optimizationAnalysis ||
    results.aiInsights.riskAnalysis ||
    results.aiInsights.criticismAnalysis
  );

  const hasCriticism = (
    results.counterArguments?.length ||
    results.challengedAssumptions?.length ||
    results.overengineeringDetections?.length ||
    results.alternativePerspectives?.length
  );

  return (
    <Paper p="md" withBorder>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Group>
          <IconRobot size={24} />
          <Title order={3}>AI Analysis Results</Title>
          <Badge color={getConfidenceColor(results.confidence)} variant="filled">
            {Math.round(results.confidence * 100)}% confidence
          </Badge>
        </Group>
        
        <Group gap="xs">
          {fromCache && (
            <Badge color="blue" variant="light">
              Cached ({performanceGain}% faster)
            </Badge>
          )}
          {failedAgents.length > 0 && (
            <Badge color="orange" variant="light">
              {failedAgents.length} agents failed
            </Badge>
          )}
        </Group>
      </Group>

      {/* AI Insights Summary */}
      {hasAIInsights && (
        <Alert icon={<IconBrain size={16} />} color="blue" variant="light" mb="md">
          <Text size="sm" fw={500}>AI-Powered Analysis</Text>
          <Text size="xs" c="dimmed">
            Advanced AI agents analyzed your workflow and provided intelligent insights beyond rule-based analysis.
            {results.aiInsights?.overallConfidence && (
              <> AI confidence: {Math.round(results.aiInsights.overallConfidence * 100)}%</>
            )}
          </Text>
        </Alert>
      )}

      {/* Execution Status */}
      <Card withBorder mb="md" p="sm">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Agent Execution Status</Text>
          <Text size="xs" c="dimmed">
            {executedAgents.length} executed, {failedAgents.length} failed
          </Text>
        </Group>
        
        <Group gap="xs">
          {executedAgents.map(agent => (
            <Badge key={agent} color="green" variant="light" size="sm">
              <IconCheck size={12} style={{ marginRight: 4 }} />
              {agent}
            </Badge>
          ))}
          {failedAgents.map(agent => (
            <Badge key={agent} color="red" variant="light" size="sm">
              <IconX size={12} style={{ marginRight: 4 }} />
              {agent}
            </Badge>
          ))}
        </Group>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconTarget size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab 
            value="risks" 
            leftSection={<IconShield size={16} />}
            rightSection={results.risks.length > 0 ? <Badge size="sm">{results.risks.length}</Badge> : null}
          >
            Risks
          </Tabs.Tab>
          <Tabs.Tab 
            value="improvements" 
            leftSection={<IconBulb size={16} />}
            rightSection={results.improvements.length > 0 ? <Badge size="sm">{results.improvements.length}</Badge> : null}
          >
            Improvements
          </Tabs.Tab>
          <Tabs.Tab 
            value="bottlenecks" 
            leftSection={<IconBottle size={16} />}
            rightSection={results.bottlenecks.length > 0 ? <Badge size="sm">{results.bottlenecks.length}</Badge> : null}
          >
            Bottlenecks
          </Tabs.Tab>
          {hasCriticism && (
            <Tabs.Tab value="criticism" leftSection={<IconQuestionMark size={16} />}>
              AI Criticism
            </Tabs.Tab>
          )}
          {hasAIInsights && (
            <Tabs.Tab value="ai-insights" leftSection={<IconBrain size={16} />}>
              AI Insights
            </Tabs.Tab>
          )}
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Group grow>
              <Card withBorder p="md" style={{ textAlign: 'center' }}>
                <ThemeIcon size="xl" color={results.risks.length > 0 ? 'red' : 'green'} variant="light" mx="auto" mb="xs">
                  <IconShield size={24} />
                </ThemeIcon>
                <Text size="xl" fw={700}>{results.risks.length}</Text>
                <Text size="sm" c="dimmed">Risks Identified</Text>
              </Card>
              
              <Card withBorder p="md" style={{ textAlign: 'center' }}>
                <ThemeIcon size="xl" color={results.improvements.length > 0 ? 'blue' : 'gray'} variant="light" mx="auto" mb="xs">
                  <IconBulb size={24} />
                </ThemeIcon>
                <Text size="xl" fw={700}>{results.improvements.length}</Text>
                <Text size="sm" c="dimmed">Improvements</Text>
              </Card>
              
              <Card withBorder p="md" style={{ textAlign: 'center' }}>
                <ThemeIcon size="xl" color={results.bottlenecks.length > 0 ? 'orange' : 'green'} variant="light" mx="auto" mb="xs">
                  <IconBottle size={24} />
                </ThemeIcon>
                <Text size="xl" fw={700}>{results.bottlenecks.length}</Text>
                <Text size="sm" c="dimmed">Bottlenecks</Text>
              </Card>
            </Group>

            {/* Quick Summary */}
            {hasAIInsights && results.aiInsights?.optimizationAnalysis && (
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>AI Summary</Text>
                    <Collapse in={expandedSections.aiSummary || results.aiInsights.optimizationAnalysis.length <= 300}>
                      <Text size="sm" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>
                        {results.aiInsights.optimizationAnalysis}
                      </Text>
                    </Collapse>
                    {!expandedSections.aiSummary && results.aiInsights.optimizationAnalysis.length > 300 && (
                      <Text size="sm" mt="xs">
                        {results.aiInsights.optimizationAnalysis.substring(0, 300)}...
                      </Text>
                    )}
                  </div>
                  {results.aiInsights.optimizationAnalysis.length > 300 && (
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => toggleSection('aiSummary')}
                    >
                      {expandedSections.aiSummary ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </ActionIcon>
                  )}
                </Group>
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Risks Tab */}
        <Tabs.Panel value="risks" pt="md">
          <Stack gap="md">
            {results.risks.length === 0 ? (
              <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                <Text size="sm">No significant risks identified in your workflow.</Text>
              </Alert>
            ) : (
              <Accordion>
                {results.risks.map((risk, index) => (
                  <Accordion.Item key={index} value={`risk-${index}`}>
                    <Accordion.Control>
                      <Group>
                        <Badge color={getSeverityColor(risk.severity)} variant="filled">
                          {risk.severity}
                        </Badge>
                        <Text size="sm">{risk.description}</Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        <Text size="sm"><strong>Affected Stages:</strong> {risk.affectedStages.join(', ')}</Text>
                        <Text size="sm"><strong>Mitigation:</strong> {risk.mitigation}</Text>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}

            {hasAIInsights && results.aiInsights?.riskAnalysis && (
              <>
                <Divider />
                <Alert icon={<IconBrain size={16} />} color="blue" variant="light">
                  <Text size="sm" fw={500}>AI Risk Analysis</Text>
                  <Text size="sm" mt="xs">{results.aiInsights.riskAnalysis}</Text>
                </Alert>
              </>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Improvements Tab */}
        <Tabs.Panel value="improvements" pt="md">
          <Stack gap="md">
            {results.improvements.length === 0 ? (
              <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                <Text size="sm">Your workflow appears to be well-optimized. No major improvements suggested.</Text>
              </Alert>
            ) : (
              <Accordion>
                {results.improvements.map((improvement, index) => (
                  <Accordion.Item key={index} value={`improvement-${index}`}>
                    <Accordion.Control>
                      <Group>
                        <Badge color={getSeverityColor(improvement.priority)} variant="filled">
                          {improvement.priority}
                        </Badge>
                        <Badge color="gray" variant="light">
                          {improvement.type}
                        </Badge>
                        <Text size="sm">{improvement.description}</Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        <Text size="sm"><strong>Implementation:</strong> {improvement.implementation}</Text>
                        <Text size="sm"><strong>Goal Alignment:</strong> {Math.round(improvement.goalAlignment * 100)}%</Text>
                        {improvement.tradeoffs.length > 0 && (
                          <div>
                            <Text size="sm" fw={500}>Trade-offs:</Text>
                            <List size="sm">
                              {improvement.tradeoffs.map((tradeoff, i) => (
                                <List.Item key={i}>{tradeoff}</List.Item>
                              ))}
                            </List>
                          </div>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Bottlenecks Tab */}
        <Tabs.Panel value="bottlenecks" pt="md">
          <Stack gap="md">
            {results.bottlenecks.length === 0 ? (
              <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                <Text size="sm">No significant bottlenecks detected in your workflow.</Text>
              </Alert>
            ) : (
              <Accordion>
                {results.bottlenecks.map((bottleneck, index) => (
                  <Accordion.Item key={index} value={`bottleneck-${index}`}>
                    <Accordion.Control>
                      <Group>
                        <Badge color={getSeverityColor(bottleneck.impact)} variant="filled">
                          {bottleneck.impact} impact
                        </Badge>
                        <Badge color="gray" variant="light">
                          {bottleneck.type}
                        </Badge>
                        <Text size="sm">{bottleneck.description}</Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        <Text size="sm"><strong>Affected Stages:</strong> {bottleneck.affectedStages.join(', ')}</Text>
                        {bottleneck.suggestions.length > 0 && (
                          <div>
                            <Text size="sm" fw={500}>Suggestions:</Text>
                            <List size="sm">
                              {bottleneck.suggestions.map((suggestion, i) => (
                                <List.Item key={i}>{suggestion}</List.Item>
                              ))}
                            </List>
                          </div>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </Stack>
        </Tabs.Panel>

        {/* AI Criticism Tab */}
        {hasCriticism && (
          <Tabs.Panel value="criticism" pt="md">
            <Stack gap="md">
              <Alert icon={<IconQuestionMark size={16} />} color="yellow" variant="light">
                <Text size="sm" fw={500}>AI Critical Analysis</Text>
                <Text size="xs" c="dimmed">
                  The AI critic challenges assumptions and identifies potential overengineering to provide balanced perspectives.
                </Text>
              </Alert>

              {/* Counter Arguments */}
              {results.counterArguments && results.counterArguments.length > 0 && (
                <div>
                  <Text size="sm" fw={500} mb="xs">Counter Arguments</Text>
                  <Accordion>
                    {results.counterArguments.map((counter, index) => (
                      <Accordion.Item key={index} value={`counter-${index}`}>
                        <Accordion.Control>
                          <Group>
                            <Badge color={getSeverityColor(counter.severity)} variant="light">
                              {counter.severity}
                            </Badge>
                            <Text size="sm">{counter.argument}</Text>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="xs">
                            <Text size="sm"><strong>Target:</strong> {counter.targetType} - {counter.targetId}</Text>
                            <Text size="sm"><strong>Reasoning:</strong> {counter.reasoning}</Text>
                            {counter.tradeoffs.length > 0 && (
                              <div>
                                <Text size="sm" fw={500}>Considerations:</Text>
                                <List size="sm">
                                  {counter.tradeoffs.map((tradeoff, i) => (
                                    <List.Item key={i}>{tradeoff}</List.Item>
                                  ))}
                                </List>
                              </div>
                            )}
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Challenged Assumptions */}
              {results.challengedAssumptions && results.challengedAssumptions.length > 0 && (
                <div>
                  <Text size="sm" fw={500} mb="xs">Challenged Assumptions</Text>
                  <Accordion>
                    {results.challengedAssumptions.map((assumption, index) => (
                      <Accordion.Item key={index} value={`assumption-${index}`}>
                        <Accordion.Control>
                          <Text size="sm">{assumption.assumption}</Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="xs">
                            <Text size="sm"><strong>Challenge:</strong> {assumption.challenge}</Text>
                            <Text size="sm"><strong>Alternative:</strong> {assumption.alternativeApproach}</Text>
                            <Text size="sm"><strong>Risk:</strong> {assumption.riskOfChallenge}</Text>
                            <Text size="sm"><strong>Benefit:</strong> {assumption.benefitOfChallenge}</Text>
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Overengineering Detections */}
              {results.overengineeringDetections && results.overengineeringDetections.length > 0 && (
                <div>
                  <Text size="sm" fw={500} mb="xs">Overengineering Detections</Text>
                  <Accordion>
                    {results.overengineeringDetections.map((detection, index) => (
                      <Accordion.Item key={index} value={`overeng-${index}`}>
                        <Accordion.Control>
                          <Group>
                            <Badge color="orange" variant="light">
                              {detection.type.replace('_', ' ')}
                            </Badge>
                            <Text size="sm">{detection.description}</Text>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="xs">
                            <Text size="sm"><strong>Affected:</strong> {detection.affectedComponents.join(', ')}</Text>
                            <Text size="sm"><strong>Simplification:</strong> {detection.simplificationSuggestion}</Text>
                            {detection.potentialDownsides.length > 0 && (
                              <div>
                                <Text size="sm" fw={500}>Potential Downsides:</Text>
                                <List size="sm">
                                  {detection.potentialDownsides.map((downside, i) => (
                                    <List.Item key={i}>{downside}</List.Item>
                                  ))}
                                </List>
                              </div>
                            )}
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </div>
              )}
            </Stack>
          </Tabs.Panel>
        )}

        {/* AI Insights Tab */}
        {hasAIInsights && (
          <Tabs.Panel value="ai-insights" pt="md">
            <Stack gap="md">
              <Alert icon={<IconBrain size={16} />} color="blue" variant="light">
                <Text size="sm" fw={500}>AI-Powered Deep Analysis</Text>
                <Text size="xs" c="dimmed">
                  These insights are generated by advanced AI agents that understand workflow patterns and best practices.
                </Text>
              </Alert>

              {results.aiInsights?.optimizationAnalysis && (
                <Card withBorder p="md">
                  <Text size="sm" fw={500} mb="xs">Optimization Analysis</Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {results.aiInsights.optimizationAnalysis}
                  </Text>
                </Card>
              )}

              {results.aiInsights?.riskAnalysis && (
                <Card withBorder p="md">
                  <Text size="sm" fw={500} mb="xs">Risk Analysis</Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {results.aiInsights.riskAnalysis}
                  </Text>
                </Card>
              )}

              {results.aiInsights?.criticismAnalysis && (
                <Card withBorder p="md">
                  <Text size="sm" fw={500} mb="xs">Critical Analysis</Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {results.aiInsights.criticismAnalysis}
                  </Text>
                </Card>
              )}

              {results.aiInsights?.overallConfidence && (
                <Card withBorder p="md">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>AI Confidence Assessment</Text>
                    <Badge color={getConfidenceColor(results.aiInsights.overallConfidence)} variant="filled">
                      {Math.round(results.aiInsights.overallConfidence * 100)}%
                    </Badge>
                  </Group>
                  <Progress 
                    value={results.aiInsights.overallConfidence * 100} 
                    color={getConfidenceColor(results.aiInsights.overallConfidence)}
                    size="sm"
                  />
                  <Text size="xs" c="dimmed" mt="xs">
                    Based on workflow clarity, pattern recognition, and analysis depth
                  </Text>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>
    </Paper>
  );
}
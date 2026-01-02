'use client'

import React from 'react'
import { 
  Paper, 
  Title, 
  Select, 
  Alert, 
  Group, 
  Text, 
  Stack,
  Loader,
  Badge
} from '@mantine/core'
import { IconTarget, IconInfoCircle, IconBulb } from '@tabler/icons-react'
import { Goal, GOAL_OPTIONS } from '../types/goals'

interface GoalSelectorProps {
  currentGoal: Goal
  onGoalChange: (newGoal: Goal) => void
  isReanalyzing?: boolean
  disabled?: boolean
}

export default function GoalSelector({ 
  currentGoal, 
  onGoalChange, 
  isReanalyzing = false, 
  disabled = false 
}: GoalSelectorProps) {
  const handleGoalChange = (value: string | null) => {
    if (value && value !== currentGoal) {
      onGoalChange(value as Goal)
    }
  }

  const currentGoalOption = GOAL_OPTIONS.find(option => option.value === currentGoal)

  return (
    <Paper shadow="md" p="xl" radius="md">
      <Group justify="space-between" mb="lg">
        <Group>
          <IconTarget size={24} />
          <Title order={3}>Optimization Goal</Title>
        </Group>
        {isReanalyzing && (
          <Group gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="blue">Re-analyzing...</Text>
          </Group>
        )}
      </Group>

      <Stack gap="lg">
        <Select
          label="Select optimization goal to see different recommendations"
          description="Change the goal to see how different optimization priorities affect the analysis"
          value={currentGoal}
          onChange={handleGoalChange}
          data={GOAL_OPTIONS.map((option) => ({
            value: option.value,
            label: `${option.label} - ${option.description}`
          }))}
          disabled={disabled || isReanalyzing}
        />

        {/* Current Goal Description */}
        <Alert 
          icon={<IconTarget size={16} />} 
          title={`Current Focus: ${currentGoal.charAt(0).toUpperCase() + currentGoal.slice(1)}`}
          color="blue"
          variant="light"
        >
          <Text size="sm">
            {currentGoalOption?.description}
          </Text>
        </Alert>

        {/* Re-analysis Instructions */}
        {!disabled && !isReanalyzing && (
          <Alert 
            icon={<IconBulb size={16} />} 
            title="Tip" 
            color="gray"
            variant="light"
          >
            <Text size="sm">
              Change the goal above to see how different optimization priorities affect the analysis recommendations. 
              The system will automatically re-run the analysis with the new goal context.
            </Text>
          </Alert>
        )}

        {/* Disabled State Message */}
        {disabled && !isReanalyzing && (
          <Alert 
            icon={<IconInfoCircle size={16} />} 
            title="Goal Selection Disabled" 
            color="gray"
            variant="light"
          >
            <Text size="sm">
              Complete the initial analysis to enable goal changes.
            </Text>
          </Alert>
        )}
      </Stack>
    </Paper>
  )
}
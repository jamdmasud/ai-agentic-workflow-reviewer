import React, { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  TextInput,
  Select,
  NumberInput,
  Button,
  Group,
  Stack,
  Alert,
  Badge,
  Divider,
  Code,
  Loader,
  PasswordInput
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRobot, IconCheck, IconX, IconInfoCircle, IconSettings, IconEye, IconEyeOff } from '@tabler/icons-react';
import { AIAgentConfig } from '../agents/AIAgent';

interface AIConfigurationPanelProps {
  config: AIAgentConfig;
  onConfigChange: (config: AIAgentConfig) => void;
  onTestConnection?: () => Promise<{ success: boolean; error?: string; provider?: string }>;
}

export function AIConfigurationPanel({ 
  config, 
  onConfigChange, 
  onTestConnection 
}: AIConfigurationPanelProps) {
  // Initialize with the provided config, but manage state independently
  const [localConfig, setLocalConfig] = useState<AIAgentConfig>(() => ({
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 2000,
    ...config
  }));
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    error?: string;
    provider?: string;
  }>({ tested: false, success: false });

  const handleConfigUpdate = (updates: Partial<AIAgentConfig>) => {
    console.log('handleConfigUpdate called with:', updates);
    const newConfig = { ...localConfig, ...updates };
    console.log('New config:', newConfig);
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
    
    // Reset connection status when config changes
    setConnectionStatus({ tested: false, success: false });
  };

  const handleTestConnection = async () => {
    if (!onTestConnection) return;
    
    setIsTestingConnection(true);
    try {
      const result = await onTestConnection();
      setConnectionStatus({
        tested: true,
        success: result.success,
        error: result.error,
        provider: result.provider
      });
      
      if (result.success) {
        notifications.show({
          title: 'Connection Successful',
          message: `Successfully connected to ${result.provider} AI service`,
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } else {
        notifications.show({
          title: 'Connection Failed',
          message: result.error || 'Failed to connect to AI service',
          color: 'red',
          icon: <IconX size={16} />
        });
      }
    } catch (error) {
      setConnectionStatus({
        tested: true,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          description: 'GPT-4.1, GPT-4o models with enhanced coding capabilities',
          apiKeyLabel: 'OpenAI API Key',
          apiKeyPlaceholder: 'sk-...',
          defaultModel: 'gpt-4.1',
          models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini'],
          setupInstructions: 'Get your API key from https://platform.openai.com/api-keys'
        };
      case 'anthropic':
        return {
          name: 'Anthropic',
          description: 'Claude 3 models',
          apiKeyLabel: 'Anthropic API Key',
          apiKeyPlaceholder: 'sk-ant-...',
          defaultModel: 'claude-3-sonnet-20240229',
          models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
          setupInstructions: 'Get your API key from https://console.anthropic.com/'
        };
      case 'local':
        return {
          name: 'Local Model',
          description: 'Ollama or other local AI service',
          apiKeyLabel: 'API Key (if required)',
          apiKeyPlaceholder: 'Optional',
          defaultModel: 'llama2',
          models: ['llama2', 'codellama', 'mistral', 'custom'],
          setupInstructions: 'Install Ollama from https://ollama.ai/ and run: ollama serve'
        };
      default:
        return {
          name: 'Unknown',
          description: 'Unknown provider',
          apiKeyLabel: 'API Key',
          apiKeyPlaceholder: '',
          defaultModel: '',
          models: [],
          setupInstructions: ''
        };
    }
  };

  const providerInfo = getProviderInfo(localConfig.provider || 'openai');

  return (
    <Paper p="md" withBorder>
      <Group mb="md">
        <IconRobot size={24} />
        <Title order={3}>AI Agent Configuration</Title>
        {connectionStatus.tested && (
          <Badge 
            color={connectionStatus.success ? 'green' : 'red'}
            variant="filled"
          >
            {connectionStatus.success ? 'Connected' : 'Failed'}
          </Badge>
        )}
      </Group>

      <Text size="sm" c="dimmed" mb="lg">
        Configure AI agents to provide intelligent workflow analysis and optimization suggestions.
      </Text>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert color="gray" variant="light" mb="md">
          <Text size="xs">
            Debug: API Key length: {localConfig.apiKey?.length || 0}, Provider: {localConfig.provider}
          </Text>
        </Alert>
      )}

      <Stack gap="md">
        {/* Provider Selection */}
        <Select
          label="AI Provider"
          description="Choose your AI service provider"
          value={localConfig.provider || 'openai'}
          onChange={(value) => handleConfigUpdate({ 
            provider: value as 'openai' | 'anthropic' | 'local',
            model: getProviderInfo(value || 'openai').defaultModel
          })}
          data={[
            { value: 'openai', label: 'OpenAI (GPT-4.1, GPT-4o)' },
            { value: 'anthropic', label: 'Anthropic (Claude 3)' },
            { value: 'local', label: 'Local Model (Ollama)' }
          ]}
        />

        {/* Provider Info */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm" fw={500}>{providerInfo.name}</Text>
          <Text size="xs" c="dimmed">{providerInfo.description}</Text>
          {providerInfo.setupInstructions && (
            <Text size="xs" mt="xs">
              Setup: {providerInfo.setupInstructions}
            </Text>
          )}
        </Alert>

        {/* API Key */}
        {localConfig.provider !== 'local' && (
          <>
            <PasswordInput
              label={providerInfo.apiKeyLabel}
              description="Your API key will be stored securely in your browser session"
              placeholder={providerInfo.apiKeyPlaceholder}
              value={localConfig.apiKey || ''}
              onChange={(event) => {
                const value = event.currentTarget.value;
                console.log('API Key input changed:', value);
                handleConfigUpdate({ apiKey: value });
              }}
              required
              visibilityToggleIcon={({ reveal }) =>
                reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />
              }
            />
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              <Text size="xs">
                🔒 <strong>Security:</strong> Your API key is stored in your browser's session storage and is automatically cleared when you close the browser. 
                It's never sent to any server except your chosen AI provider.
              </Text>
            </Alert>
          </>
        )}

        {/* Base URL for local provider */}
        {localConfig.provider === 'local' && (
          <>
            <TextInput
              label="Base URL"
              description="URL of your local AI service"
              placeholder="http://localhost:11434"
              value={localConfig.baseUrl || 'http://localhost:11434'}
              onChange={(event) => handleConfigUpdate({ baseUrl: event.currentTarget.value })}
              required
            />
            <PasswordInput
              label="API Key (Optional)"
              description="API key if your local service requires authentication"
              placeholder="Optional"
              value={localConfig.apiKey || ''}
              onChange={(event) => handleConfigUpdate({ apiKey: event.currentTarget.value })}
              visibilityToggleIcon={({ reveal }) =>
                reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />
              }
            />
          </>
        )}

        {/* Model Selection */}
        <Select
          label="Model"
          description="AI model to use for analysis"
          value={localConfig.model || providerInfo.defaultModel}
          onChange={(value) => handleConfigUpdate({ model: value || providerInfo.defaultModel })}
          data={providerInfo.models.map(model => ({ value: model, label: model }))}
          searchable
          allowDeselect={false}
        />

        <Divider />

        {/* Advanced Settings */}
        <Title order={5}>Advanced Settings</Title>

        <NumberInput
          label="Temperature"
          description="Controls randomness (0.0 = deterministic, 1.0 = creative)"
          value={localConfig.temperature || 0.3}
          onChange={(value) => handleConfigUpdate({ temperature: Number(value) || 0.3 })}
          min={0}
          max={1}
          step={0.1}
          decimalScale={1}
        />

        <NumberInput
          label="Max Tokens"
          description="Maximum tokens per AI response"
          value={localConfig.maxTokens || 2000}
          onChange={(value) => handleConfigUpdate({ maxTokens: Number(value) || 2000 })}
          min={100}
          max={8000}
          step={100}
        />

        <Divider />

        {/* Connection Test */}
        <Group justify="space-between">
          <div>
            <Text size="sm" fw={500}>Connection Test</Text>
            <Text size="xs" c="dimmed">
              Test your AI configuration with a simple request
            </Text>
          </div>
          <Button
            onClick={handleTestConnection}
            loading={isTestingConnection}
            disabled={!localConfig.apiKey && localConfig.provider !== 'local'}
            leftSection={isTestingConnection ? <Loader size={16} /> : <IconSettings size={16} />}
          >
            Test Connection
          </Button>
        </Group>

        {connectionStatus.tested && !connectionStatus.success && (
          <Alert color="red" icon={<IconX size={16} />}>
            <Text size="sm" fw={500}>Connection Failed</Text>
            <Text size="xs">{connectionStatus.error}</Text>
          </Alert>
        )}

        {/* Usage Information */}
        <Divider />
        
        <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
          <Text size="sm" fw={500}>Usage Notes</Text>
          <Text size="xs" mt="xs">
            • AI analysis may take 10-30 seconds depending on workflow complexity
            <br />
            • API costs apply for OpenAI and Anthropic (typically $0.01-0.10 per analysis)
            <br />
            • Local models are free but require more system resources
            <br />
            • Results are cached to minimize API calls and costs
          </Text>
        </Alert>

        {/* Example Configuration */}
        <details>
          <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Example Configuration
          </summary>
          <Code block mt="xs" style={{ fontSize: '12px' }}>
{`// OpenAI Configuration
{
  "provider": "openai",
  "apiKey": "sk-your-openai-key",
  "model": "gpt-4",
  "temperature": 0.3,
  "maxTokens": 2000
}

// Local Ollama Configuration  
{
  "provider": "local",
  "baseUrl": "http://localhost:11434",
  "model": "llama2",
  "temperature": 0.3,
  "maxTokens": 2000
}`}
          </Code>
        </details>
      </Stack>
    </Paper>
  );
}
# AI Configuration Guide

Your Agentic Workflow Reviewer now includes AI-powered analysis! Here's how to set it up:

## 🚀 Quick Start

1. **Click the AI/Settings button** in the top-right corner of the app
2. **Choose your AI provider**:
   - **OpenAI** (Recommended): Most advanced, requires API key
   - **Anthropic**: Claude models, requires API key  
   - **Local**: Free but requires local setup

3. **Configure your chosen provider** (see details below)
4. **Test the connection** using the "Test Connection" button
5. **Toggle "AI-Powered Analysis"** in the workflow form

## 🔧 Provider Setup

### OpenAI (Recommended)
1. Get API key from: https://platform.openai.com/api-keys
2. Choose model: `gpt-4.1` (latest with enhanced coding) or `gpt-4.1-mini` (faster/cheaper)
3. Cost: ~$0.01-0.10 per analysis

### Anthropic  
1. Get API key from: https://console.anthropic.com/
2. Choose model: `claude-3-sonnet-20240229` (recommended)
3. Cost: ~$0.01-0.10 per analysis

### Local (Free)
1. Install Ollama: https://ollama.ai/
2. Run: `ollama pull llama2` (or another model)
3. Start: `ollama serve`
4. Use base URL: `http://localhost:11434`

## 🤖 What AI Analysis Provides

- **Intelligent Pattern Recognition**: Identifies CI/CD, data processing, approval workflows
- **Goal-Aware Suggestions**: Tailored recommendations for reliability, cost, or simplicity
- **Critical Analysis**: AI critic challenges assumptions and identifies overengineering
- **Advanced Risk Assessment**: Context-aware risk identification
- **Alternative Perspectives**: Multiple approaches and trade-offs

## 💡 Example Configurations

### OpenAI Configuration
```json
{
  "provider": "openai",
  "apiKey": "sk-your-openai-key-here",
  "model": "gpt-4.1",
  "temperature": 0.3,
  "maxTokens": 2000
}
```

### Local Ollama Configuration
```json
{
  "provider": "local",
  "baseUrl": "http://localhost:11434",
  "model": "llama2",
  "temperature": 0.3,
  "maxTokens": 2000
}
```

## 🔒 Security & Privacy

- **API keys are stored in your browser's session storage** (cleared when browser closes)
- **Settings are stored in localStorage** (provider, model, etc. - no sensitive data)
- **No data is sent to third parties** except your chosen AI provider
- **Local models keep everything on your machine**
- **Analysis results are cached locally** to minimize API calls

### Storage Details
- **Session Storage**: API keys (cleared when you close the browser)
- **Local Storage**: Non-sensitive settings like provider and model choice
- **No Server Storage**: Nothing is stored on external servers

## 🆚 AI vs Regular Analysis

| Feature | Regular Analysis | AI Analysis |
|---------|------------------|-------------|
| Speed | Fast (< 1 second) | Slower (10-30 seconds) |
| Cost | Free | ~$0.01-0.10 per analysis |
| Intelligence | Rule-based patterns | Context-aware insights |
| Suggestions | Generic templates | Workflow-specific |
| Critical Thinking | None | AI critic challenges assumptions |
| Pattern Recognition | Basic keywords | Advanced understanding |

## 🎯 Best Practices

1. **Start with regular analysis** to understand the basics
2. **Use AI for complex workflows** where you need deeper insights
3. **Try different goals** (reliability, cost, simplicity) to see varied AI perspectives
4. **Review AI criticism** - it often provides valuable alternative viewpoints
5. **Cache results** are used automatically to minimize costs

## 🔧 Troubleshooting

**Connection Failed?**
- Check your API key is correct
- Verify internet connection (for cloud providers)
- For local: ensure Ollama is running (`ollama serve`)

**Analysis Taking Too Long?**
- Cloud providers: Check API rate limits
- Local models: Ensure sufficient system resources

**Poor Results?**
- Try a more advanced model (GPT-4.1 vs GPT-4.1-mini)
- Increase temperature for more creative suggestions
- Provide more detailed workflow descriptions

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Test your configuration with the "Test Connection" button
3. Try a different AI provider
4. Ensure your workflow input is clear and detailed

Happy analyzing! 🚀
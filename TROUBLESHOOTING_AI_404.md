# Troubleshooting AI 404 Error

If you're getting a 404 error when testing the AI connection, here are the most common causes and solutions:

## 🔍 Common Causes of 404 Error

### 1. Invalid API Key Format
**OpenAI**: API keys must start with `sk-`
**Anthropic**: API keys must start with `sk-ant-`

**Solution**: Double-check your API key format and make sure you copied it completely.

### 2. Invalid Model Name
The model name you selected might not be available or correctly formatted.

**OpenAI Valid Models**:
- `gpt-4.1` (latest, recommended - enhanced coding)
- `gpt-4.1-mini` (faster, cheaper)
- `gpt-4.1-nano` (most efficient)
- `gpt-4o` (previous generation)
- `gpt-4o-mini` (previous generation, faster)

**Anthropic Valid Models**:
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229` (recommended)
- `claude-3-haiku-20240307`

**Solution**: Try using `gpt-4.1` for OpenAI or `claude-3-sonnet-20240229` for Anthropic.

### 3. Expired or Invalid API Key
Your API key might be expired, revoked, or doesn't have the necessary permissions.

**Solution**: 
- Generate a new API key from your provider's dashboard
- Make sure the key has the correct permissions for chat completions

### 4. Network/Proxy Issues
Corporate firewalls or proxies might be blocking the API requests.

**Solution**: 
- Try from a different network
- Check if your organization blocks AI API endpoints
- Consider using a local model instead

## 🛠️ Debugging Steps

### Step 1: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Click "Test Connection"
4. Look for detailed error messages

### Step 2: Verify API Key
1. Go to your AI provider's dashboard
2. Check if the API key is active
3. Verify it has the correct permissions
4. Try generating a new key

### Step 3: Test with Different Model
1. Change the model to a faster one:
   - OpenAI: `gpt-4.1-mini` or `gpt-4.1-nano`
   - Anthropic: `claude-3-haiku-20240307`
2. Test the connection again

### Step 4: Try Local Model (Free Alternative)
1. Install Ollama: https://ollama.ai/
2. Run: `ollama pull llama2`
3. Start: `ollama serve`
4. In the app, select "Local Model" provider
5. Use base URL: `http://localhost:11434`
6. Model: `llama2`

## 🔧 Quick Fixes

### Reset Configuration
1. Clear your browser's localStorage and sessionStorage
2. Refresh the page
3. Reconfigure from scratch

### Try Different Browser
Sometimes browser extensions or settings can interfere with API calls.

### Check API Status
- OpenAI Status: https://status.openai.com/
- Anthropic Status: https://status.anthropic.com/

## 📞 Still Having Issues?

If none of these solutions work:

1. **Check the browser console** for detailed error messages
2. **Try the local model option** as a free alternative
3. **Verify your internet connection** can reach the AI provider's servers
4. **Contact your AI provider's support** if the issue persists

The improved error handling should now give you more specific information about what's causing the 404 error.
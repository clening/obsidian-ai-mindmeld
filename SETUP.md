# Quick Setup Guide

## Installation

1. **Download/Clone**: Get the plugin files
2. **Copy to Obsidian**: Move the entire folder to `.obsidian/plugins/ai-mindmap-generator/`
3. **Enable Plugin**: Go to Settings → Community Plugins → Enable "AI Mindmap Generator"

## First Time Setup

### 1. Get API Key
Choose your preferred LLM provider:

**Anthropic Claude (Recommended)**
- Visit [console.anthropic.com](https://console.anthropic.com/)
- Create account and generate API key
- Model: `claude-3-5-sonnet-latest`

**OpenAI GPT**  
- Visit [platform.openai.com](https://platform.openai.com/)
- Create account and generate API key
- Model: `gpt-4-turbo-preview` or `gpt-3.5-turbo`

### 2. Configure Plugin
1. Open Obsidian Settings
2. Go to "AI Mindmap Generator" 
3. Select your LLM Provider
4. Paste your API Key
5. Click "Test Connection" to verify

### 3. First Mindmap
1. Create a few test notes with tags:
   ```yaml
   ---
   title: "Test Note 1"
   tags: [research, ai, technology]
   ---
   ```
2. Use Command Palette: "AI Mindmap: Generate from selection"
3. Select your test notes
4. Click "Generate Mindmap"

## Troubleshooting

**Connection Issues**
- Double-check API key
- Verify internet connection
- Check API credits/quota

**No Content Found**
- Ensure notes have content (not just frontmatter)
- Check file selection in modal

**Build Issues (Development)**
```bash
npm install
npm run build
```

## Next Steps
- Tag more of your notes for better mindmaps
- Experiment with different tag weighting settings
- Try folder-based or tag-based generation modes

Happy mindmapping! 🧠✨
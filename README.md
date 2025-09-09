# AI Mindmap Generator for Obsidian

An intelligent mindmap plugin that automatically generates hierarchical knowledge visualizations from your Obsidian notes using AI analysis. Combines the power of LLMs (Claude, GPT) with existing tag structures to create meaningful knowledge maps.

## Features

### 🧠 AI-Powered Analysis
- **Smart Content Processing**: Analyzes multiple notes simultaneously to identify themes and relationships
- **LLM Integration**: Supports Anthropic Claude, OpenAI GPT, and custom APIs
- **Semantic Understanding**: Goes beyond keywords to understand conceptual relationships

### 🏷️ Tag-Aware Generation
- **YAML Frontmatter Integration**: Incorporates existing tags from your note metadata
- **Multi-parent Connections**: Nodes can connect to multiple parents based on shared concepts
- **Tag Hierarchy Detection**: Automatically recognizes and uses tag hierarchies (e.g., `deeptech/quantum-ai`)

### 📊 Flexible Visualization
- **Interactive Mindmaps**: Expandable/collapsible tree structure with metadata
- **Multiple Output Formats**: Generate as new notes, interactive views, or both
- **Export Options**: Export as Markdown or images (planned)

### ⚙️ Customizable Settings
- **Tag Weighting**: Configure how heavily existing tags influence the mindmap structure
- **Source Selection**: Choose from individual files, folders, or tag-based collections
- **Provider Options**: Support for multiple LLM providers with configurable models

## Installation

### Manual Installation (Development)
1. Clone or download this repository
2. Copy the folder to your `.obsidian/plugins/` directory
3. Enable the plugin in Obsidian Settings → Community Plugins
4. Configure your API key in the plugin settings

### From Community Plugins (Coming Soon)
This plugin will be available in the Obsidian community plugin store once it's released.

## Setup

### 1. Get an API Key
Choose one of the supported providers:
- **Anthropic Claude**: Get your API key from [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI GPT**: Get your API key from [platform.openai.com](https://platform.openai.com/)

### 2. Configure the Plugin
1. Open Settings → AI Mindmap Generator
2. Select your preferred LLM provider
3. Enter your API key
4. Choose your model (Claude 3.5 Sonnet recommended)
5. Test the connection

### 3. Set Your Preferences
- **Tag Weighting**: How much existing tags should influence the mindmap structure
- **Output Format**: Whether to create notes, open views, or both
- **Multi-parent Connections**: Enable nodes to connect to multiple parents

## Usage

### Quick Start
1. **Generate from Current Note**: Use Command Palette → "Generate mindmap from current note"
2. **Select Multiple Sources**: Use Command Palette → "Generate mindmap from selected files"
3. **Use the Ribbon Icon**: Click the brain icon in the sidebar

### Source Selection Methods

#### 📄 Individual Files
Select specific notes to include in your mindmap analysis.

#### 📁 Folder-Based
Choose entire folders (with optional subfolder inclusion) to process all markdown files within.

#### 🏷️ Tag-Based
Generate mindmaps from all notes containing specific tags.

### Example Workflow

1. **Tag Your Notes**: Use YAML frontmatter to tag your notes:
   ```yaml
   ---
   title: "Quantum Computing Research"
   tags: [deeptech, quantum-ai, research, breakthrough]
   ---
   ```

2. **Select Sources**: Choose notes with related tags like `#deeptech` and `#quantum-ai`

3. **Generate Mindmap**: The AI will create a structure incorporating your existing tags:
   ```
   # Deep Technology Research
   - Quantum Computing
     - Quantum AI Applications [ALSO: AI Research]
     - Hardware Breakthroughs
   - AI Research  
     - Machine Learning Integration
     - Quantum-Classical Hybrid Systems [ALSO: Quantum Computing]
   ```

## Settings Reference

| Setting | Description | Default |
|---------|-------------|---------|
| **LLM Provider** | Claude, OpenAI, or Custom API | Claude |
| **Model** | Specific model version | claude-3-5-sonnet-latest |
| **Max Tokens** | Maximum response length | 4000 |
| **Tag Weighting** | How heavily tags influence structure | High |
| **Multi-parent Connections** | Allow nodes with multiple parents | Enabled |
| **Output Format** | Note, view, or both | Both |
| **Max Source Files** | Maximum files per mindmap | 50 |

## Examples

### Research Project Mindmap
**Input**: Notes tagged with `#research`, `#methodology`, `#findings`  
**Output**: Hierarchical research structure with methodology → findings relationships

### Learning Path Mindmap  
**Input**: Course notes with `#beginner`, `#intermediate`, `#advanced`  
**Output**: Progressive learning structure showing skill dependencies

### Project Knowledge Map
**Input**: Project files tagged with `#frontend`, `#backend`, `#database`  
**Output**: System architecture mindmap with component relationships

## Advanced Features

### Multi-parent Connections
When enabled, the AI can create nodes that connect to multiple parent categories:

```
# Technology Stack
- Frontend Development
  - React Components
  - State Management [ALSO: Backend Integration]
- Backend Integration  
  - API Design
  - State Management [ALSO: Frontend Development]
```

### Tag Hierarchy Recognition
The plugin automatically detects hierarchical tag patterns:
- `deeptech/quantum-ai/hardware` → Creates nested structure
- Related tags create cross-connections between branches

## Development

### Building from Source
```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Project Structure
```
src/
├── main.ts                 # Plugin entry point
├── services/
│   ├── contentAggregator.ts # Content extraction & processing
│   ├── llmService.ts        # AI API integration
│   └── mindmapGenerator.ts  # Structure generation
├── components/
│   ├── sourceSelectorModal.ts # File/tag selection UI
│   └── mindmapView.ts       # Mindmap visualization
└── types/
    └── interfaces.ts        # TypeScript definitions
```

## API Costs

Typical usage costs (approximate):
- **Claude 3.5 Sonnet**: ~$0.01-0.05 per mindmap (10-20 notes)
- **GPT-4**: ~$0.02-0.08 per mindmap (10-20 notes)
- **GPT-3.5**: ~$0.001-0.005 per mindmap (10-20 notes)

Costs depend on content length and complexity. The plugin includes token limits to control costs.

## Troubleshooting

### Common Issues

**"API connection failed"**
- Verify your API key is correct and active
- Check your internet connection
- Ensure you have API credits remaining

**"No content found in selection"**  
- Make sure selected files contain markdown content
- Check that files aren't empty or contain only frontmatter

**"Request timeout"**
- Try reducing the number of source files
- Increase the max tokens setting if content is very long
- Check your internet connection stability

### Debug Mode
Enable debug logging in the plugin settings to see detailed processing information in the Developer Console (Ctrl+Shift+I).

## Roadmap

### Phase 1 (Current)
- [x] Basic AI mindmap generation
- [x] Tag integration
- [x] Multi-provider support
- [x] Interactive tree view

### Phase 2 (Planned)
- [x] Visual mindmap rendering (using Markmap/D3.js)
- [ ] Image export functionality
- [ ] Real-time mindmap updates when notes change
- [ ] Custom prompt templates

### Phase 3 (Future)
- [ ] Collaboration features
- [ ] Knowledge graph generation
- [ ] Integration with other mindmap plugins
- [ ] Mobile app support

## Known issues
- [ ] WHen combining mindmaps, the combination does not always maintain the STEEPLE structure, and often will regroup child categories in the wrong STEEPLE category.
- [ ] Formatting in the MD file gets confused when merging and adds links as ##s instead of *s
- [ ] The source view of the original mindmap generation has a horizontal spread that continues to persist, despite NUMEROUS edits to the GUI -- it's some sort of SVG rendering issue. I fix it, and then it goes back to sucking every time Claude Code makes an update
- [ ] Saved MD mindmaps only create *s not ##s, and link associations fail.   

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/clening/obsidian-ai-mindmap/issues)
- **Discussions**: [GitHub Discussions](https://github.com/clening/obsidian-ai-mindmap/discussions)
- **Documentation**: [Wiki](https://github.com/clening/obsidian-ai-mindmap/wiki)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by [NotebookLM](https://notebooklm.google.com/) automatic mindmaps
- Built on the [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- Uses [Markmap](https://markmap.js.org/) for visualization (planned)
- Thanks to the Obsidian community for feedback and testing

---

**Made with ❤️ for the Obsidian community**

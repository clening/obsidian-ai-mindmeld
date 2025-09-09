import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PluginSettings, SourceSelection } from './src/types/interfaces';
import { ContentAggregator } from './src/services/contentAggregator';
import { LLMService } from './src/services/llmService';
import { MindmapGenerator } from './src/services/mindmapGenerator';
import { MindmapPersistenceService } from './src/services/mindmapPersistence';
import { SourceSelectorModal } from './src/components/sourceSelectorModal';
import { MindmapView, VIEW_TYPE_MINDMAP } from './src/components/mindmapView';
import { VisualMindmapView, VIEW_TYPE_VISUAL_MINDMAP } from './src/components/visualMindmapView';
import { MindmapCombinerModal } from './src/components/mindmapCombinerModal';

const DEFAULT_SETTINGS: PluginSettings = {
  llmProvider: 'claude',
  apiKey: '',
  model: 'claude-3-5-sonnet-latest',
  maxTokens: 4000,
  includeContent: true,
  tagWeighting: 'high',
  autoSave: true,
  outputFormat: 'both',
  enableMultiParent: true,
  maxSourceFiles: 50,
  mindmapsFolder: 'AI Mindmaps',
  saveFormat: 'both'
}

export default class AIMindmapPlugin extends Plugin {
  settings: PluginSettings;
  contentAggregator: ContentAggregator;
  llmService: LLMService;
  mindmapGenerator: MindmapGenerator;
  persistenceService: MindmapPersistenceService;

  async onload() {
    await this.loadSettings();

    // Initialize services
    this.contentAggregator = new ContentAggregator(this.app);
    this.llmService = new LLMService(this.settings);
    this.mindmapGenerator = new MindmapGenerator();
    this.persistenceService = new MindmapPersistenceService(this.app, this);
    
    // Initialize persistence service
    await this.persistenceService.initialize();

    // Register views
    this.registerView(
      VIEW_TYPE_MINDMAP,
      (leaf) => new MindmapView(leaf, this)
    );
    
    this.registerView(
      VIEW_TYPE_VISUAL_MINDMAP,
      (leaf) => new VisualMindmapView(leaf, this)
    );

    // Add ribbon icon
    const ribbonIconEl = this.addRibbonIcon('brain-circuit', 'AI Mindmap Generator', (evt: MouseEvent) => {
      this.openSourceSelector();
    });

    // Add combine mindmaps ribbon icon
    const combineRibbonEl = this.addRibbonIcon('link', 'Combine Mindmaps', (evt: MouseEvent) => {
      this.openMindmapCombiner();
    });

    // Add commands
    this.addCommand({
      id: 'generate-mindmap-from-selection',
      name: 'Generate mindmap from selected files',
      callback: () => {
        this.openSourceSelector();
      }
    });

    this.addCommand({
      id: 'generate-mindmap-from-current',
      name: 'Generate mindmap from current note',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.generateFromCurrentNote(view);
      }
    });

    this.addCommand({
      id: 'generate-mindmap-from-tag',
      name: 'Generate mindmap from tag',
      callback: () => {
        this.openTagSelector();
      }
    });

    this.addCommand({
      id: 'open-visual-mindmap',
      name: 'Open visual mindmap view',
      callback: () => {
        this.activateVisualMindmapView();
      }
    });

    this.addCommand({
      id: 'combine-mindmaps',
      name: 'Combine multiple mindmaps',
      callback: () => {
        this.openMindmapCombiner();
      }
    });

    // Add settings tab
    this.addSettingTab(new AIMindmapSettingTab(this.app, this));

    console.log('AI Mindmap Generator plugin loaded');
  }

  onunload() {
    console.log('AI Mindmap Generator plugin unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Update services when settings change
    this.llmService.updateSettings(this.settings);
  }

  openSourceSelector() {
    new SourceSelectorModal(this.app, this, (selection: SourceSelection) => {
      this.generateMindmapFromSelection(selection);
    }).open();
  }

  async generateFromCurrentNote(view: MarkdownView) {
    if (!view) {
      new Notice('No active note found');
      return;
    }

    const file = view.file;
    if (!file) {
      new Notice('Current view has no associated file');
      return;
    }

    const selection: SourceSelection = {
      files: [file.path],
      folders: [],
      tags: [],
      includeSubfolders: false,
      contentPreview: ''
    };

    await this.generateMindmapFromSelection(selection);
  }

  async openTagSelector() {
    // This will be implemented in Phase 2
    new Notice('Tag selector coming in next version!');
  }

  async openMindmapCombiner() {
    try {
      console.log('Opening mindmap combiner modal...');
      
      // First check if we have any saved mindmaps
      const savedMindmaps = await this.persistenceService.getAllMindmaps();
      console.log(`Found ${savedMindmaps.length} saved mindmaps`);
      
      if (savedMindmaps.length < 2) {
        new Notice('You need at least 2 saved mindmaps to combine. Generate more mindmaps first!');
        return;
      }
      
      const modal = new MindmapCombinerModal(this.app, this);
      modal.open();
      console.log('Mindmap combiner modal opened successfully');
    } catch (error) {
      console.error('Failed to open mindmap combiner:', error);
      new Notice(`Failed to open mindmap combiner: ${error.message}`);
    }
  }

  async generateMindmapFromSelection(selection: SourceSelection) {
    if (!this.settings.apiKey) {
      new Notice('Please configure your API key in settings first');
      return;
    }

    try {
      new Notice('Analyzing content and generating mindmap...');

      // Step 1: Aggregate content
      const processedContent = await this.contentAggregator.processSelection(selection);
      
      if (processedContent.length === 0) {
        new Notice('No content found in selection');
        return;
      }

      // Step 2: Generate mindmap via LLM
      const llmResponse = await this.llmService.generateMindmapStructure(
        processedContent,
        this.extractAllTags(processedContent)
      );

      if (!llmResponse.success) {
        new Notice(`Failed to generate mindmap: ${llmResponse.error}`);
        return;
      }

      // Step 3: Create mindmap structure
      const mindmapStructure = await this.mindmapGenerator.buildStructure(
        llmResponse.structure,
        processedContent,
        this.settings
      );

      // Step 4: Display/save results
      const sourceFiles = processedContent.map(content => content.filePath);
      await this.displayMindmap(mindmapStructure, sourceFiles);

      new Notice(`Mindmap generated successfully! (${processedContent.length} sources processed)`);

    } catch (error) {
      console.error('Error generating mindmap:', error);
      new Notice(`Error: ${error.message}`);
    }
  }

  private extractAllTags(processedContent: any[]): string[] {
    const allTags = new Set<string>();
    processedContent.forEach(content => {
      content.tags?.forEach((tag: string) => allTags.add(tag));
    });
    return Array.from(allTags);
  }

  private async displayMindmap(structure: any, sourceFiles: string[] = []) {
    if (this.settings.outputFormat === 'note' || this.settings.outputFormat === 'both') {
      await this.createMindmapNote(structure);
    }

    if (this.settings.outputFormat === 'view' || this.settings.outputFormat === 'both') {
      await this.openVisualMindmapView(structure, sourceFiles);
    }
  }

  private async createMindmapNote(structure: any) {
    const fileName = `AI Mindmap - ${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.md`;
    const markdownContent = this.mindmapGenerator.convertToMarkdown(structure);
    
    await this.app.vault.create(fileName, markdownContent);
    
    if (this.settings.autoSave) {
      new Notice(`Mindmap saved as: ${fileName}`);
    }
  }

  private async openVisualMindmapView(structure: any, sourceFiles: string[] = []) {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: VIEW_TYPE_VISUAL_MINDMAP,
      state: { 
        mindmapData: structure,
        sourceFiles: sourceFiles
      }
    });
    this.app.workspace.revealLeaf(leaf);
  }

  async activateVisualMindmapView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_VISUAL_MINDMAP);
    
    if (leaves.length > 0) {
      // Focus existing view
      this.app.workspace.revealLeaf(leaves[0]);
    } else {
      // Create new view
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.setViewState({
        type: VIEW_TYPE_VISUAL_MINDMAP
      });
      this.app.workspace.revealLeaf(leaf);
    }
  }
}

class AIMindmapSettingTab extends PluginSettingTab {
  plugin: AIMindmapPlugin;

  constructor(app: App, plugin: AIMindmapPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'AI Mindmap Generator Settings' });

    // LLM Provider Selection
    new Setting(containerEl)
      .setName('LLM Provider')
      .setDesc('Choose your preferred language model provider')
      .addDropdown(dropdown => dropdown
        .addOption('claude', 'Anthropic Claude')
        .addOption('openai', 'OpenAI GPT')
        .addOption('custom', 'Custom API')
        .setValue(this.plugin.settings.llmProvider)
        .onChange(async (value: 'claude' | 'openai' | 'custom') => {
          this.plugin.settings.llmProvider = value;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show provider-specific options
        }));

    // API Key
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Your LLM provider API key (stored securely)')
      .addText(text => text
        .setPlaceholder('Enter your API key')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    // Model Selection
    if (this.plugin.settings.llmProvider === 'claude') {
      new Setting(containerEl)
        .setName('Model')
        .setDesc('Claude model to use for mindmap generation')
        .addDropdown(dropdown => dropdown
          .addOption('claude-3-5-sonnet-latest', 'Claude 3.5 Sonnet (Latest)')
          .addOption('claude-3-5-haiku-latest', 'Claude 3.5 Haiku (Latest)')
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          }));
    } else if (this.plugin.settings.llmProvider === 'openai') {
      new Setting(containerEl)
        .setName('Model')
        .setDesc('OpenAI model to use for mindmap generation')
        .addDropdown(dropdown => dropdown
          .addOption('gpt-4-turbo-preview', 'GPT-4 Turbo')
          .addOption('gpt-4', 'GPT-4')
          .addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo')
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          }));
    }

    // Custom API URL (only show for custom provider)
    if (this.plugin.settings.llmProvider === 'custom') {
      new Setting(containerEl)
        .setName('Custom API URL')
        .setDesc('Base URL for your custom LLM API')
        .addText(text => text
          .setPlaceholder('https://api.example.com/v1')
          .setValue(this.plugin.settings.customApiUrl || '')
          .onChange(async (value) => {
            this.plugin.settings.customApiUrl = value;
            await this.plugin.saveSettings();
          }));
    }

    // Max Tokens
    new Setting(containerEl)
      .setName('Max Tokens')
      .setDesc('Maximum tokens for LLM response')
      .addText(text => text
        .setPlaceholder('4000')
        .setValue(this.plugin.settings.maxTokens.toString())
        .onChange(async (value) => {
          const numValue = parseInt(value);
          if (!isNaN(numValue) && numValue > 0) {
            this.plugin.settings.maxTokens = numValue;
            await this.plugin.saveSettings();
          }
        }));

    containerEl.createEl('h3', { text: 'Tag Integration' });

    // Tag Weighting
    new Setting(containerEl)
      .setName('Tag Weighting')
      .setDesc('How heavily to weight existing tags in mindmap generation')
      .addDropdown(dropdown => dropdown
        .addOption('high', 'High - Tags strongly influence structure')
        .addOption('medium', 'Medium - Balanced with content analysis')
        .addOption('low', 'Low - Tags provide minor guidance')
        .setValue(this.plugin.settings.tagWeighting)
        .onChange(async (value: 'high' | 'medium' | 'low') => {
          this.plugin.settings.tagWeighting = value;
          await this.plugin.saveSettings();
        }));

    // Multi-parent connections
    new Setting(containerEl)
      .setName('Enable Multi-parent Connections')
      .setDesc('Allow nodes to connect to multiple parent nodes based on shared tags')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableMultiParent)
        .onChange(async (value) => {
          this.plugin.settings.enableMultiParent = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h3', { text: 'Output Options' });

    // Output Format
    new Setting(containerEl)
      .setName('Output Format')
      .setDesc('How to display generated mindmaps')
      .addDropdown(dropdown => dropdown
        .addOption('note', 'Create new note only')
        .addOption('view', 'Open in mindmap view only')
        .addOption('both', 'Both note and view')
        .setValue(this.plugin.settings.outputFormat)
        .onChange(async (value: 'note' | 'view' | 'both') => {
          this.plugin.settings.outputFormat = value;
          await this.plugin.saveSettings();
        }));

    // Auto-save
    new Setting(containerEl)
      .setName('Auto-save Generated Maps')
      .setDesc('Automatically save mindmaps as notes')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoSave)
        .onChange(async (value) => {
          this.plugin.settings.autoSave = value;
          await this.plugin.saveSettings();
        }));

    // Max source files
    new Setting(containerEl)
      .setName('Max Source Files')
      .setDesc('Maximum number of files to process in one mindmap')
      .addText(text => text
        .setPlaceholder('50')
        .setValue(this.plugin.settings.maxSourceFiles.toString())
        .onChange(async (value) => {
          const numValue = parseInt(value);
          if (!isNaN(numValue) && numValue > 0) {
            this.plugin.settings.maxSourceFiles = numValue;
            await this.plugin.saveSettings();
          }
        }));

    containerEl.createEl('h3', { text: 'Mindmap Storage' });

    // Mindmaps folder
    new Setting(containerEl)
      .setName('Mindmaps Folder')
      .setDesc('Folder in your vault to save mindmaps (will be created if it doesn\'t exist)')
      .addText(text => text
        .setPlaceholder('AI Mindmaps')
        .setValue(this.plugin.settings.mindmapsFolder)
        .onChange(async (value) => {
          this.plugin.settings.mindmapsFolder = value.trim() || 'AI Mindmaps';
          await this.plugin.saveSettings();
        }));

    // Save format
    new Setting(containerEl)
      .setName('Save Format')
      .setDesc('How to save mindmaps')
      .addDropdown(dropdown => dropdown
        .addOption('markdown', 'Markdown files only (recommended)')
        .addOption('both', 'Markdown + metadata backup')
        .setValue(this.plugin.settings.saveFormat)
        .onChange(async (value: 'markdown' | 'both') => {
          this.plugin.settings.saveFormat = value;
          await this.plugin.saveSettings();
        }));

    // Test connection button
    new Setting(containerEl)
      .setName('Test API Connection')
      .setDesc('Verify your API key and connection')
      .addButton(button => button
        .setButtonText('Test Connection')
        .setCta()
        .onClick(async () => {
          button.setButtonText('Testing...');
          try {
            const testResult = await this.plugin.llmService.testConnection();
            if (testResult.success) {
              new Notice('✅ API connection successful!');
            } else {
              new Notice(`❌ Connection failed: ${testResult.error}`);
            }
          } catch (error) {
            new Notice(`❌ Connection error: ${error.message}`);
          }
          button.setButtonText('Test Connection');
        }));
  }
}
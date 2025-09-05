const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');
const logger = require('./logger');
const config = require('../config');

class PluginManager extends EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();
        this.activePlugins = new Set();
        this.pluginStates = new Map();
        this.pluginConfigs = new Map();
        this.hooks = new Map();
        this.isInitialized = false;
    }

    async initializePlugins() {
        if (this.isInitialized) return;

        try {
            await this.loadPlugins();
            await this.activatePlugins();
            await this.setupPluginHooks();
            
            this.isInitialized = true;
            logger.info(`Plugin manager initialized with ${this.plugins.size} plugins`);
        } catch (error) {
            logger.error('Plugin manager initialization failed:', error);
            throw error;
        }
    }

    async loadPlugins() {
        const pluginsPath = path.join(__dirname, '..', 'plugins');
        
        if (!await fs.pathExists(pluginsPath)) {
            await this.createPluginStructure();
        }

        const pluginFiles = (await fs.readdir(pluginsPath))
            .filter(file => file.endsWith('.js'));

        for (const file of pluginFiles) {
            await this.loadPlugin(file);
        }
    }

    async loadPlugin(filename) {
        try {
            const pluginPath = path.join(__dirname, '..', 'plugins', filename);
            
            delete require.cache[require.resolve(pluginPath)];
            const pluginModule = require(pluginPath);
            
            if (!this.validatePlugin(pluginModule)) {
                logger.warn(`Invalid plugin structure: ${filename}`);
                return false;
            }

            pluginModule.filename = filename;
            pluginModule.filepath = pluginPath;
            pluginModule.loaded = new Date();

            this.plugins.set(pluginModule.name, pluginModule);
            this.pluginStates.set(pluginModule.name, 'loaded');
            
            if (pluginModule.config) {
                this.pluginConfigs.set(pluginModule.name, pluginModule.config);
            }

            logger.debug(`Loaded plugin: ${pluginModule.name}`);
            return true;
        } catch (error) {
            logger.error(`Failed to load plugin ${filename}:`, error);
            return false;
        }
    }

    validatePlugin(plugin) {
        const required = ['name', 'version', 'execute'];
        
        for (const field of required) {
            if (!plugin[field]) return false;
        }

        if (typeof plugin.execute !== 'function') return false;
        
        return true;
    }

    async createPluginStructure() {
        const pluginsPath = path.join(__dirname, '..', 'plugins');
        await fs.ensureDir(pluginsPath);

        const defaultPlugins = {
            'autoReply.js': this.generateAutoReplyPlugin(),
            'chatBot.js': this.generateChatBotPlugin(),
            'antiSpam.js': this.generateAntiSpamPlugin(),
            'welcome.js': this.generateWelcomePlugin(),
            'autoSticker.js': this.generateAutoStickerPlugin()
        };

        for (const [filename, content] of Object.entries(defaultPlugins)) {
            const pluginPath = path.join(pluginsPath, filename);
            if (!await fs.pathExists(pluginPath)) {
                await fs.writeFile(pluginPath, content);
            }
        }

        logger.info('Created default plugin structure');
    }

    generateAutoReplyPlugin() {
        return `const { cache } = require('../utils/cache');
const logger = require('../utils/logger');

module.exports = {
    name: 'autoReply',
    version: '1.0.0',
    description: 'Automatic reply system',
    author: 'Ilom',
    enabled: true,
    priority: 1,
    
    config: {
        enabled: true,
        groupsOnly: false,
        adminBypass: true
    },

    async execute(sock, message, context) {
        try {
            const { from, text, isGroup, user, group } = context;
            
            if (!this.config.enabled) return;
            
            if (this.config.groupsOnly && !isGroup) return;
            
            const autoReplies = await cache.get('autoReplies') || {};
            const lowerText = text.toLowerCase();
            
            for (const [trigger, reply] of Object.entries(autoReplies)) {
                if (lowerText.includes(trigger.toLowerCase())) {
                    await sock.sendMessage(from, { text: reply });
                    
                    logger.info(\`Auto-reply triggered: \${trigger}\`);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            logger.error('AutoReply plugin error:', error);
            return false;
        }
    },

    async onLoad() {
        logger.info('AutoReply plugin loaded');
    },

    async onUnload() {
        logger.info('AutoReply plugin unloaded');
    }
};`;
    }

    generateChatBotPlugin() {
        return `const logger = require('../utils/logger');

module.exports = {
    name: 'chatBot',
    version: '1.0.0',
    description: 'AI chatbot integration',
    author: 'Ilom',
    enabled: true,
    priority: 5,
    
    config: {
        enabled: true,
        groupMentionOnly: true,
        maxLength: 500
    },

    async execute(sock, message, context) {
        try {
            const { from, text, isGroup, user, sender } = context;
            
            if (!this.config.enabled) return;
            
            if (isGroup && this.config.groupMentionOnly) {
                const botMention = '@' + sock.user.id.split(':')[0];
                if (!text.includes(botMention)) return;
            }
            
            if (text.length > this.config.maxLength) return;
            
            const aiService = require('../services/aiService');
            const response = await aiService.generateResponse(text, user, isGroup);
            
            if (response) {
                await sock.sendMessage(from, {
                    text: response,
                    contextInfo: isGroup ? { mentionedJid: [sender] } : undefined
                });
                
                logger.info(\`ChatBot response sent to \${sender}\`);
                return true;
            }
            
            return false;
        } catch (error) {
            logger.error('ChatBot plugin error:', error);
            return false;
        }
    },

    async onLoad() {
        logger.info('ChatBot plugin loaded');
    },

    async onUnload() {
        logger.info('ChatBot plugin unloaded');
    }
};`;
    }

    generateAntiSpamPlugin() {
        return `const { cache } = require('../utils/cache');
const logger = require('../utils/logger');

module.exports = {
    name: 'antiSpam',
    version: '1.0.0',
    description: 'Anti-spam protection',
    author: 'Ilom',
    enabled: true,
    priority: 10,
    
    config: {
        enabled: true,
        maxMessages: 5,
        timeWindow: 10000,
        action: 'warn'
    },

    async execute(sock, message, context) {
        try {
            const { from, sender, isGroup, isGroupAdmin } = context;
            
            if (!this.config.enabled || !isGroup || isGroupAdmin) return;
            
            const spamKey = \`spam_\${sender}\`;
            const messages = await cache.get(spamKey) || [];
            
            const now = Date.now();
            const recentMessages = messages.filter(time => now - time < this.config.timeWindow);
            
            recentMessages.push(now);
            await cache.set(spamKey, recentMessages, 60);
            
            if (recentMessages.length >= this.config.maxMessages) {
                switch (this.config.action) {
                    case 'warn':
                        await sock.sendMessage(from, {
                            text: \`⚠️ @\${sender.split('@')[0]} Please slow down your messages!\`,
                            contextInfo: { mentionedJid: [sender] }
                        });
                        break;
                    case 'mute':
                        // Implement mute logic
                        break;
                    case 'kick':
                        await sock.groupParticipantsUpdate(from, [sender], 'remove');
                        break;
                }
                
                logger.warn(\`Anti-spam triggered for \${sender}\`);
                return true;
            }
            
            return false;
        } catch (error) {
            logger.error('AntiSpam plugin error:', error);
            return false;
        }
    },

    async onLoad() {
        logger.info('AntiSpam plugin loaded');
    },

    async onUnload() {
        logger.info('AntiSpam plugin unloaded');
    }
};`;
    }

    generateWelcomePlugin() {
        return `const logger = require('../utils/logger');

module.exports = {
    name: 'welcome',
    version: '1.0.0',
    description: 'Welcome new members',
    author: 'Ilom',
    enabled: true,
    priority: 3,
    
    config: {
        enabled: true,
        defaultMessage: 'Welcome {user} to {group}! 👋'
    },

    async execute(sock, data, context) {
        try {
            const { action, participants, groupId } = data;
            
            if (!this.config.enabled || action !== 'add') return;
            
            const { getGroup } = require('../models/Group');
            const group = await getGroup(groupId);
            
            if (!group || !group.settings?.welcome?.enabled) return;
            
            for (const participant of participants) {
                const welcomeMessage = (group.settings.welcome.message || this.config.defaultMessage)
                    .replace('{user}', \`@\${participant.split('@')[0]}\`)
                    .replace('{group}', group.name);
                
                await sock.sendMessage(groupId, {
                    text: welcomeMessage,
                    contextInfo: { mentionedJid: [participant] }
                });
                
                logger.info(\`Welcome message sent to \${participant}\`);
            }
            
            return true;
        } catch (error) {
            logger.error('Welcome plugin error:', error);
            return false;
        }
    },

    async onLoad() {
        logger.info('Welcome plugin loaded');
    },

    async onUnload() {
        logger.info('Welcome plugin unloaded');
    }
};`;
    }

    generateAutoStickerPlugin() {
        return `const logger = require('../utils/logger');

module.exports = {
    name: 'autoSticker',
    version: '1.0.0',
    description: 'Auto convert images to stickers',
    author: 'Ilom',
    enabled: true,
    priority: 2,
    
    config: {
        enabled: true,
        keywords: ['sticker', 'stiker', 's'],
        autoConvert: false
    },

    async execute(sock, message, context) {
        try {
            const { from, text, messageType, media } = context;
            
            if (!this.config.enabled) return;
            
            const shouldConvert = this.config.autoConvert || 
                this.config.keywords.some(keyword => 
                    text.toLowerCase().includes(keyword.toLowerCase())
                );
            
            if (!shouldConvert || messageType !== 'image') return;
            
            const mediaService = require('../services/mediaService');
            const buffer = await sock.downloadMediaMessage(message, 'buffer', {});
            
            const stickerBuffer = await mediaService.createSticker(buffer, {
                pack: 'Ilom Bot',
                author: 'Auto Sticker'
            });
            
            await sock.sendMessage(from, { sticker: stickerBuffer });
            
            logger.info('Auto sticker created');
            return true;
        } catch (error) {
            logger.error('AutoSticker plugin error:', error);
            return false;
        }
    },

    async onLoad() {
        logger.info('AutoSticker plugin loaded');
    },

    async onUnload() {
        logger.info('AutoSticker plugin unloaded');
    }
};`;
    }

    async activatePlugins() {
        for (const [name, plugin] of this.plugins) {
            if (plugin.enabled !== false) {
                await this.activatePlugin(name);
            }
        }
    }

    async activatePlugin(name) {
        try {
            const plugin = this.plugins.get(name);
            if (!plugin) return false;

    async activatePlugin(name) {
        try {
            const plugin = this.plugins.get(name);
            if (!plugin) return false;

            if (plugin.onLoad && typeof plugin.onLoad === 'function') {
                await plugin.onLoad();
            }

            this.activePlugins.add(name);
            this.pluginStates.set(name, 'active');
            
            logger.info(`Activated plugin: ${name}`);
            this.emit('plugin:activated', name, plugin);
            
            return true;
        } catch (error) {
            logger.error(`Failed to activate plugin ${name}:`, error);
            this.pluginStates.set(name, 'error');
            return false;
        }
    }

    async deactivatePlugin(name) {
        try {
            const plugin = this.plugins.get(name);
            if (!plugin) return false;

            if (plugin.onUnload && typeof plugin.onUnload === 'function') {
                await plugin.onUnload();
            }

            this.activePlugins.delete(name);
            this.pluginStates.set(name, 'inactive');
            
            logger.info(`Deactivated plugin: ${name}`);
            this.emit('plugin:deactivated', name, plugin);
            
            return true;
        } catch (error) {
            logger.error(`Failed to deactivate plugin ${name}:`, error);
            return false;
        }
    }

    async reloadPlugin(name) {
        try {
            const plugin = this.plugins.get(name);
            if (!plugin) return false;

            await this.deactivatePlugin(name);
            
            const success = await this.loadPlugin(plugin.filename);
            if (success) {
                await this.activatePlugin(name);
                logger.info(`Reloaded plugin: ${name}`);
                return true;
            }

            return false;
        } catch (error) {
            logger.error(`Failed to reload plugin ${name}:`, error);
            return false;
        }
    }

    async setupPluginHooks() {
        this.hooks.set('message', []);
        this.hooks.set('command', []);
        this.hooks.set('groupUpdate', []);
        this.hooks.set('userJoin', []);
        this.hooks.set('userLeave', []);

        for (const [name, plugin] of this.plugins) {
            if (this.activePlugins.has(name) && plugin.hooks) {
                for (const hookName of plugin.hooks) {
                    if (this.hooks.has(hookName)) {
                        this.hooks.get(hookName).push({ name, plugin });
                    }
                }
            }
        }
    }

    async executeHook(hookName, ...args) {
        const hookPlugins = this.hooks.get(hookName) || [];
        const results = [];

        for (const { name, plugin } of hookPlugins) {
            if (!this.activePlugins.has(name)) continue;

            try {
                const result = await plugin.execute(...args);
                results.push({ plugin: name, result });
            } catch (error) {
                logger.error(`Plugin hook error [${name}]:`, error);
                results.push({ plugin: name, error: error.message });
            }
        }

        return results;
    }

    async executePlugins(type, ...args) {
        const activePlugins = Array.from(this.activePlugins)
            .map(name => ({ name, plugin: this.plugins.get(name) }))
            .filter(({ plugin }) => plugin && plugin.execute)
            .sort((a, b) => (b.plugin.priority || 0) - (a.plugin.priority || 0));

        const results = [];

        for (const { name, plugin } of activePlugins) {
            try {
                const result = await plugin.execute(...args);
                results.push({ plugin: name, result });

                if (result === true) {
                    logger.debug(`Plugin ${name} handled the ${type} event`);
                    break;
                }
            } catch (error) {
                logger.error(`Plugin execution error [${name}]:`, error);
                results.push({ plugin: name, error: error.message });
            }
        }

        return results;
    }

    getPlugin(name) {
        return this.plugins.get(name);
    }

    getAllPlugins() {
        return Array.from(this.plugins.values());
    }

    getActivePlugins() {
        return Array.from(this.activePlugins).map(name => this.plugins.get(name));
    }

    getPluginState(name) {
        return this.pluginStates.get(name) || 'unknown';
    }

    isPluginActive(name) {
        return this.activePlugins.has(name);
    }

    getPluginConfig(name) {
        return this.pluginConfigs.get(name);
    }

    updatePluginConfig(name, config) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.config = { ...plugin.config, ...config };
            this.pluginConfigs.set(name, plugin.config);
            
            logger.info(`Updated config for plugin: ${name}`);
            this.emit('plugin:config-updated', name, config);
            
            return true;
        }
        return false;
    }

    async installPlugin(pluginData, filename) {
        try {
            if (!this.validatePlugin(pluginData)) {
                throw new Error('Invalid plugin structure');
            }

            const pluginPath = path.join(__dirname, '..', 'plugins', filename);
            
            if (await fs.pathExists(pluginPath)) {
                throw new Error('Plugin already exists');
            }

            const pluginCode = typeof pluginData === 'string' ? pluginData : 
                `module.exports = ${JSON.stringify(pluginData, null, 2)};`;

            await fs.writeFile(pluginPath, pluginCode);
            
            const success = await this.loadPlugin(filename);
            if (success) {
                const plugin = this.plugins.get(pluginData.name);
                if (plugin.enabled !== false) {
                    await this.activatePlugin(pluginData.name);
                }
                
                logger.info(`Installed plugin: ${pluginData.name}`);
                return true;
            }

            await fs.remove(pluginPath);
            return false;
        } catch (error) {
            logger.error(`Failed to install plugin:`, error);
            throw error;
        }
    }

    async uninstallPlugin(name) {
        try {
            const plugin = this.plugins.get(name);
            if (!plugin) return false;

            await this.deactivatePlugin(name);
            
            await fs.remove(plugin.filepath);
            
            this.plugins.delete(name);
            this.activePlugins.delete(name);
            this.pluginStates.delete(name);
            this.pluginConfigs.delete(name);

            logger.info(`Uninstalled plugin: ${name}`);
            this.emit('plugin:uninstalled', name);
            
            return true;
        } catch (error) {
            logger.error(`Failed to uninstall plugin ${name}:`, error);
            return false;
        }
    }

    getPluginStats() {
        const total = this.plugins.size;
        const active = this.activePlugins.size;
        const inactive = total - active;
        
        const states = {};
        for (const [name, state] of this.pluginStates) {
            states[state] = (states[state] || 0) + 1;
        }

        return {
            total,
            active,
            inactive,
            states,
            hooks: Object.fromEntries(
                Array.from(this.hooks.entries()).map(([hook, plugins]) => [hook, plugins.length])
            )
        };
    }

    searchPlugins(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const plugin of this.plugins.values()) {
            const searchText = `${plugin.name} ${plugin.description || ''} ${plugin.author || ''}`.toLowerCase();
            
            if (searchText.includes(lowerQuery)) {
                results.push({
                    ...plugin,
                    active: this.isPluginActive(plugin.name),
                    state: this.getPluginState(plugin.name)
                });
            }
        }

        return results;
    }

    getPluginInfo(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return null;

        return {
            name: plugin.name,
            version: plugin.version,
            description: plugin.description,
            author: plugin.author,
            enabled: plugin.enabled,
            priority: plugin.priority || 0,
            config: this.getPluginConfig(name),
            active: this.isPluginActive(name),
            state: this.getPluginState(name),
            loaded: plugin.loaded,
            filepath: plugin.filepath,
            hooks: plugin.hooks || []
        };
    }

    generatePluginList() {
        const plugins = this.getAllPlugins().map(plugin => ({
            name: plugin.name,
            version: plugin.version,
            description: plugin.description,
            author: plugin.author,
            active: this.isPluginActive(plugin.name),
            state: this.getPluginState(plugin.name)
        }));

        let list = `🔌 *Plugin Manager*\n\n`;
        list += `📊 *Statistics:*\n`;
        list += `├ Total Plugins: ${plugins.length}\n`;
        list += `├ Active: ${this.activePlugins.size}\n`;
        list += `├ Inactive: ${plugins.length - this.activePlugins.size}\n`;
        list += `╰ Hooks: ${this.hooks.size}\n\n`;

        list += `📋 *Plugin List:*\n`;
        plugins.forEach(plugin => {
            const status = plugin.active ? '✅' : '❌';
            list += `${status} *${plugin.name}* v${plugin.version}\n`;
            list += `   ${plugin.description}\n`;
            list += `   Author: ${plugin.author}\n\n`;
        });

        return list;
    }

    async enableAllPlugins() {
        let enabled = 0;
        
        for (const [name, plugin] of this.plugins) {
            if (!this.isPluginActive(name)) {
                const success = await this.activatePlugin(name);
                if (success) enabled++;
            }
        }

        logger.info(`Enabled ${enabled} plugins`);
        return enabled;
    }

    async disableAllPlugins() {
        let disabled = 0;
        
        for (const name of this.activePlugins) {
            const success = await this.deactivatePlugin(name);
            if (success) disabled++;
        }

        logger.info(`Disabled ${disabled} plugins`);
        return disabled;
    }

    async cleanup() {
        try {
            await this.disableAllPlugins();
            
            this.plugins.clear();
            this.activePlugins.clear();
            this.pluginStates.clear();
            this.pluginConfigs.clear();
            this.hooks.clear();
            
            this.isInitialized = false;
            logger.info('Plugin manager cleaned up');
        } catch (error) {
            logger.error('Plugin cleanup error:', error);
        }
    }

    getActiveCount() {
        return this.activePlugins.size;
    }
}

const pluginManager = new PluginManager();

module.exports = {
    pluginManager,
    initializePlugins: () => pluginManager.initializePlugins(),
    loadPlugins: () => pluginManager.loadPlugins(),
    activatePlugin: (name) => pluginManager.activatePlugin(name),
    deactivatePlugin: (name) => pluginManager.deactivatePlugin(name),
    reloadPlugin: (name) => pluginManager.reloadPlugin(name),
    executePlugins: (type, ...args) => pluginManager.executePlugins(type, ...args),
    executeHook: (hook, ...args) => pluginManager.executeHook(hook, ...args),
    getPlugin: (name) => pluginManager.getPlugin(name),
    getAllPlugins: () => pluginManager.getAllPlugins(),
    getActivePlugins: () => pluginManager.getActivePlugins(),
    isPluginActive: (name) => pluginManager.isPluginActive(name),
    getPluginInfo: (name) => pluginManager.getPluginInfo(name),
    getPluginStats: () => pluginManager.getPluginStats(),
    updatePluginConfig: (name, config) => pluginManager.updatePluginConfig(name, config),
    installPlugin: (data, filename) => pluginManager.installPlugin(data, filename),
    uninstallPlugin: (name) => pluginManager.uninstallPlugin(name),
    searchPlugins: (query) => pluginManager.searchPlugins(query),
    generatePluginList: () => pluginManager.generatePluginList(),
    enableAllPlugins: () => pluginManager.enableAllPlugins(),
    disableAllPlugins: () => pluginManager.disableAllPlugins(),
    getActiveCount: () => pluginManager.getActiveCount()
};
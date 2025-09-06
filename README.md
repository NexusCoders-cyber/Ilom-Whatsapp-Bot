# 🧠 Amazing Bot 🧠 v1 - Ilom WhatsApp Bot

> **Advanced WhatsApp Bot with AI, Media Processing, and Comprehensive Features**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ilom-tech/whatsapp-bot)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](Dockerfile)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## ✨ Features

### 🤖 **AI Integration**
- **ChatGPT & Gemini** - Advanced AI conversations
- **Image Generation** - DALL-E integration
- **Text Analysis** - Sentiment, language detection
- **Translation** - Multi-language support

### 📥 **Media Downloader**
- **YouTube** - Video/Audio download
- **Instagram** - Post media extraction
- **TikTok** - Video download
- **Facebook, Twitter, Spotify** - Multi-platform support
- **Google Drive, MediaFire** - File downloads

### 🎨 **Media Processing**
- **Image Processing** - Resize, crop, filters, compression
- **Sticker Creation** - Static & animated stickers
- **Video Processing** - Convert, compress, GIF creation
- **Audio Processing** - Format conversion, trimming
- **Advanced Features** - OCR, QR codes, memes, collages

### 🎮 **Games & Economy**
- **Economy System** - Virtual currency, daily rewards
- **Interactive Games** - Trivia, hangman, math games
- **Leaderboards** - User rankings and statistics

### 🛡️ **Moderation & Admin**
- **Anti-Spam** - Smart spam detection
- **Anti-Link** - Link filtering with whitelist
- **Warning System** - Progressive moderation
- **Welcome/Goodbye** - Customizable messages
- **Group Management** - Admin tools and controls

### 🔧 **Advanced Features**
- **Plugin System** - Extensible architecture
- **Task Scheduler** - Automated maintenance
- **Web Dashboard** - REST API and monitoring
- **Multi-language** - 10+ language support
- **Rate Limiting** - Abuse prevention
- **Comprehensive Logging** - Detailed activity logs

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- MongoDB
- FFmpeg (for media processing)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ilom-tech/whatsapp-bot.git
   cd whatsapp-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

5. **Scan QR code** with WhatsApp and enjoy! 🎉

## 🐳 Docker Installation

```bash
# Clone and build
git clone https://github.com/ilom-tech/whatsapp-bot.git
cd whatsapp-bot

# Start with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f ilom-bot
```

## ⚙️ Configuration

### Essential Environment Variables

```bash
# Bot Configuration
BOT_NAME=Your Bot Name
OWNER_NUMBERS=254700143167,254712345678
PREFIX=.

# Session (Choose one)
SESSION_ID=your_base64_session_data

# Database
DATABASE_URL=mongodb://localhost:27017/ilombot

# API Keys (Optional)
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key
```

### Advanced Configuration

See [`.env.example`](.env.example) for all available options including:
- API integrations
- Feature toggles  
- Security settings
- Performance tuning
- Logging options

## 📱 Usage

### Basic Commands

```
.help - Show all commands
.menu - Display command categories
.ping - Check bot status
.info - Bot information
```

### AI Commands

```
.chatgpt <question> - Ask ChatGPT
.gemini <question> - Ask Google Gemini
.translate <text> - Translate text
.analyze <text> - Analyze sentiment
```

### Media Commands

```
.sticker - Convert image to sticker
.ytdl <url> - Download YouTube video
.igdl <url> - Download Instagram media
.compress - Compress images/videos
.meme <top text> <bottom text> - Create memes
```

### Admin Commands (Groups)

```
.kick @user - Remove user from group
.ban @user - Ban user from bot
.warn @user <reason> - Warn user
.welcome on/off - Toggle welcome messages
.antilink on/off - Toggle anti-link protection
```

### Economy Commands

```
.balance - Check your balance
.daily - Claim daily reward
.work - Earn money by working
.shop - View shop items
.gamble <amount> - Gamble your coins
```

## 🔧 Development

### Project Structure

```
📦 Ilom-Whatsapp-Bot/
├── 📂 src/
│   ├── 📂 commands/          # Command modules
│   ├── 📂 handlers/          # Event & message handlers
│   ├── 📂 models/           # Database models
│   ├── 📂 plugins/          # Plugin system
│   ├── 📂 services/         # External services
│   ├── 📂 utils/            # Utility functions
│   └── 📂 api/              # REST API routes
├── 📂 tests/                # Test files
├── 📂 docs/                 # Documentation
├── 📜 index.js              # Main entry point
└── 📜 package.json          # Dependencies
```

### Adding Commands

Create a new command in `src/commands/category/`:

```javascript
module.exports = {
    name: 'mycommand',
    aliases: ['mc'],
    category: 'general',
    description: 'My custom command',
    usage: 'mycommand [args]',
    cooldown: 3,
    permissions: [],
    
    async execute({ sock, message, args, user, from }) {
        await sock.sendMessage(from, {
            text: 'Hello from my custom command!'
        });
    }
};
```

### Creating Plugins

Create a plugin in `src/plugins/`:

```javascript
module.exports = {
    name: 'myPlugin',
    version: '1.0.0',
    description: 'My custom plugin',
    
    async execute(sock, message, context) {
        // Plugin logic here
        return false; // Return true to stop other plugins
    }
};
```

## 🔌 API Endpoints

The bot includes a REST API for monitoring and management:

- `GET /` - Bot status
- `GET /health` - Health check
- `GET /stats` - Bot statistics
- `GET /api/commands` - Available commands
- `GET /api/users/stats` - User statistics
- `GET /api/groups/stats` - Group statistics

## 📊 Monitoring

### Web Dashboard
Access the web dashboard at `http://localhost:3000` for:
- Real-time statistics
- Command usage analytics
- System health monitoring
- User and group insights

### PM2 Monitoring

```bash
# Start with PM2
npm run pm2:start

# Monitor processes
pm2 monit

# View logs
pm2 logs ilom-bot
```

## 🛠️ Deployment

### Production Deployment

1. **Server Setup**
   ```bash
   # Install dependencies
   sudo apt update
   sudo apt install nodejs npm mongodb redis-server ffmpeg

   # Clone and setup
   git clone https://github.com/ilom-tech/whatsapp-bot.git
   cd whatsapp-bot
   npm install --production
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Configure production settings
   ```

3. **Start with PM2**
   ```bash
   npm install -g pm2
   npm run pm2:start
   pm2 save
   pm2 startup
   ```

### Docker Deployment

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# Scale horizontally
docker-compose up --scale ilom-bot=3
```

### Heroku Deployment

```bash
# Install Heroku CLI and login
heroku create your-bot-name

# Configure environment
heroku config:set SESSION_ID=your_session_data
heroku config:set OWNER_NUMBERS=your_numbers

# Deploy
git push heroku main
```

## 🔒 Security

- **Rate Limiting** - Prevents spam and abuse
- **User Authentication** - Owner verification
- **Input Validation** - Secure command processing
- **Error Handling** - Graceful failure management
- **Logging** - Comprehensive activity tracking

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Baileys** - WhatsApp Web API
- **OpenAI** - AI conversation capabilities
- **FFmpeg** - Media processing
- **Sharp** - Image processing
- **All contributors** who help improve this project

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/ilom-tech/whatsapp-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ilom-tech/whatsapp-bot/discussions)
- **Discord**: [Join our community](https://discord.gg/ilom)
- **Email**: contact@ilom.tech

## ⭐ Show Your Support

If this project helps you, please consider:
- Giving it a ⭐ star on GitHub
- Sharing it with others
- Contributing to the project
- Sponsoring the development

---

<div align="center">

**🧠 Amazing Bot 🧠 v1 created by Ilom**

[Website](https://ilom.tech) • [GitHub](https://github.com/ilom-tech) • [Discord](https://discord.gg/ilom)

Made with ❤️ for the WhatsApp bot community

</div>
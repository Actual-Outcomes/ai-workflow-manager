# 🤖 AI Workflow Manager

A powerful cross-platform desktop application for managing AI-powered workflows with both GUI and CLI interfaces.

## ✨ Features

- 🖥️ **Desktop GUI** - Beautiful, modern interface built with Electron and React
- 💻 **CLI Tool** - Full-featured command-line interface for automation
- 🗄️ **Local Database** - SQLite-based storage for all your workflows
- 🔄 **Workflow Management** - Create, update, and track workflow statuses
- 🎨 **Modern UI** - Sleek design with gradient backgrounds and smooth animations
- 🔒 **Secure** - Context isolation and sandboxed renderer processes
- 📦 **Cross-Platform** - Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/actualoutcomes/ai-workflow-manager.git
   cd ai-workflow-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

   This will start both the Vite dev server and Electron app.

## 📦 Building for Production

### Build the Application

```bash
npm run build
```

This compiles TypeScript and builds the React app.

### Package for Your Platform

```bash
# Package for current platform
npm run package

# Package for Windows only
npm run package:win

# Package for macOS only
npm run package:mac
```

Installers will be created in the `release/` directory.

## 💻 CLI Usage

After building, you can use the CLI:

```bash
# Build CLI
npm run build:cli

# Run CLI commands
npm run cli -- <command>
```

### CLI Commands

#### List all workflows
```bash
npm run cli -- list
# or use alias
npm run cli -- ls
```

#### Create a new workflow
```bash
npm run cli -- create "My Workflow" -d "Description here"
# or use alias
npm run cli -- new "My Workflow"
```

#### Show workflow details
```bash
npm run cli -- show <id>
# or use alias
npm run cli -- info <id>
```

#### Update a workflow
```bash
npm run cli -- update <id> --name "New Name"
npm run cli -- update <id> --status active
npm run cli -- update <id> --description "New description"
```

Valid statuses: `draft`, `active`, `paused`, `completed`

#### Delete a workflow
```bash
npm run cli -- delete <id> -y
# or use alias
npm run cli -- rm <id> -y
```

#### Show database path
```bash
npm run cli -- db-path
```

## 🏗️ Project Structure

```
ai-workflow-manager/
├── src/
│   ├── main/              # Electron main process (Node.js)
│   │   └── main.ts        # App lifecycle, window management, IPC
│   ├── preload/           # Preload scripts (secure bridge)
│   │   └── preload.ts     # Context bridge for IPC
│   ├── renderer/          # React frontend
│   │   ├── App.tsx        # Main React component
│   │   ├── App.css        # Styles
│   │   ├── main.tsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── core/              # Shared business logic
│   │   └── database.ts    # SQLite database wrapper
│   └── cli/               # CLI tool
│       └── index.ts       # Commander.js CLI
├── dist/                  # Compiled output
├── release/               # Packaged installers
├── build/                 # Build resources (icons)
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript base config
├── tsconfig.main.json     # Main process config
├── tsconfig.preload.json  # Preload script config
├── tsconfig.cli.json      # CLI config
└── vite.config.ts         # Vite configuration
```

## 🛠️ Technology Stack

### Desktop App
- **Electron 28** - Cross-platform desktop framework
- **React 18** - UI library
- **TypeScript 5** - Type-safe development
- **Vite 5** - Fast build tool and dev server
- **better-sqlite3** - High-performance SQLite wrapper

### CLI
- **Commander.js** - CLI framework
- **TypeScript** - Shared with main app

### Build & Package
- **electron-builder** - Create installers for all platforms
- **concurrently** - Run multiple dev processes

## 📝 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode (GUI) |
| `npm run dev:vite` | Start Vite dev server only |
| `npm run dev:electron` | Start Electron only |
| `npm run build` | Build all components |
| `npm run build:renderer` | Build React app |
| `npm run build:main` | Build main process |
| `npm run build:preload` | Build preload script |
| `npm run build:cli` | Build CLI tool |
| `npm run package` | Create production package |
| `npm run package:win` | Create Windows installer |
| `npm run package:mac` | Create macOS DMG |

### Development Tips

1. **Hot Reload**: The React app supports hot module replacement in dev mode
2. **DevTools**: Chrome DevTools automatically open in development
3. **Debugging**: Use VS Code's built-in debugger with Electron
4. **Database**: Located in app user data folder (see CLI `db-path` command)

## 🗄️ Database Schema

### Workflows Table
```sql
CREATE TABLE workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Future Tables
- `workflow_steps` - Individual steps in workflows
- `workflow_runs` - Execution history

## 🔒 Security

The application follows Electron security best practices:

- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Sandbox enabled
- ✅ Content Security Policy configured
- ✅ Secure IPC communication via preload script

## 🤝 Contributing

Contributions are welcome! This project is maintained by [Actual Outcomes LLC](https://github.com/actualoutcomes).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🏢 About

**AI Workflow Manager** is developed and maintained by **Actual Outcomes LLC**.

Built with ❤️ using Electron, React, and TypeScript.

---

## 🚧 Roadmap

- [ ] AI integration (OpenAI, Anthropic, etc.)
- [ ] Workflow step editor (drag-and-drop)
- [ ] Workflow execution engine
- [ ] Scheduled workflow runs
- [ ] Cloud sync (optional)
- [ ] Plugin system
- [ ] Template library
- [ ] Export/import workflows
- [ ] Dark/light theme toggle
- [ ] Multi-language support

## 📞 Support

For issues, questions, or contributions, please visit our [GitHub repository](https://github.com/actualoutcomes/ai-workflow-manager).


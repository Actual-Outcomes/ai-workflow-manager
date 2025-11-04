# 🚀 Quick Start Guide

Get up and running with AI Workflow Manager in 5 minutes!

## Step 1: Install Dependencies

```bash
cd ai-workflow-manager
npm install
```

This will install all required packages including Electron, React, and TypeScript.

## Step 2: Run in Development Mode

```bash
npm run dev
```

This command will:
1. Start the Vite dev server on port 5173
2. Launch the Electron app
3. Enable hot reload for React components
4. Open Chrome DevTools automatically

## Step 3: Try the GUI

Once the app opens:
1. Click **"+ New Workflow"** to create a workflow
2. Fill in the name and description
3. Click **"Create Workflow"**
4. Change the status using the dropdown
5. Delete workflows using the **"Delete"** button

## Step 4: Try the CLI

In a **new terminal window**:

```bash
# Build the CLI first
npm run build:cli

# List workflows
npm run cli -- list

# Create a workflow
npm run cli -- create "Test Workflow" -d "My first workflow"

# Show workflow details
npm run cli -- show 1

# Update status
npm run cli -- update 1 --status active

# Delete workflow
npm run cli -- delete 1 -y
```

## Step 5: Build for Production

When you're ready to create an installer:

```bash
# Build everything
npm run build

# Create installer for your platform
npm run package

# Or target specific platform
npm run package:win   # Windows
npm run package:mac   # macOS
```

Installers will be in the `release/` folder.

## 📁 Database Location

The SQLite database is stored in:

**Windows**: `%APPDATA%\ai-workflow-manager\workflows.db`  
**macOS**: `~/Library/Application Support/ai-workflow-manager/workflows.db`  
**Linux**: `~/.local/share/ai-workflow-manager/workflows.db`

To see the exact path:
```bash
npm run cli -- db-path
```

## 🎨 Customization

### Change App Name
Edit `package.json`:
```json
{
  "name": "your-app-name",
  "productName": "Your App Name"
}
```

### Add Icons
Place your icons in the `build/` folder:
- `icon.ico` for Windows
- `icon.icns` for macOS
- `icon.png` for Linux

### Modify UI Colors
Edit `src/renderer/App.css` to change the gradient and color scheme.

## 🐛 Troubleshooting

### Port 5173 is already in use
Change the port in `vite.config.ts`:
```typescript
server: {
  port: 5174,  // Change this
  strictPort: true
}
```

### better-sqlite3 build errors
Make sure you have build tools installed:

**Windows**: Install Visual Studio Build Tools  
**macOS**: Run `xcode-select --install`  
**Linux**: Install `build-essential`

Then run:
```bash
npm rebuild better-sqlite3
```

### Electron not starting
Clear the cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

- Read the full [README.md](./README.md)
- Check the [CONTRIBUTING.md](./CONTRIBUTING.md) guide
- Explore the [project structure](./README.md#-project-structure)
- Start building your AI integrations!

## 💡 Tips

1. **Keep Terminal Open**: The dev mode runs until you press Ctrl+C
2. **Hot Reload**: Save React files to see instant updates
3. **DevTools**: Press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac) for console
4. **CLI Workflow**: Build CLI once, then database syncs with GUI
5. **Git Ready**: Project includes `.gitignore` for clean commits

---

Happy coding! 🎉


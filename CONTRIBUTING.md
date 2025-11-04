# Contributing to AI Workflow Manager

Thank you for your interest in contributing to AI Workflow Manager! 🎉

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-workflow-manager.git
   cd ai-workflow-manager
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## Project Structure

- `src/main/` - Electron main process (Node.js backend)
- `src/renderer/` - React frontend
- `src/preload/` - Secure IPC bridge
- `src/core/` - Shared business logic
- `src/cli/` - Command-line interface

## Coding Standards

- **TypeScript**: All code should be written in TypeScript
- **Formatting**: Run `npm run format` before committing (if configured)
- **Linting**: Ensure `npm run lint` passes (if configured)
- **Security**: Follow Electron security best practices
- **IPC**: All renderer-to-main communication must go through preload script

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add workflow export functionality
fix: Resolve database connection issue
docs: Update README installation instructions
style: Format code with Prettier
refactor: Simplify workflow update logic
test: Add unit tests for database module
```

## Pull Request Process

1. Create a feature branch (`git checkout -b feature/my-feature`)
2. Make your changes
3. Test thoroughly (GUI and CLI)
4. Commit with descriptive messages
5. Push to your fork
6. Open a Pull Request with detailed description

## Testing

Currently, the project is in early stages. When adding tests:

- Use Jest for unit tests
- Use Playwright for E2E tests
- Test both GUI and CLI functionality
- Test on multiple platforms if possible

## Security

If you discover a security vulnerability, please email security@actualoutcomes.io instead of using the issue tracker.

## Questions?

Feel free to open an issue for discussion before starting work on major features.

Thank you for contributing! 🚀


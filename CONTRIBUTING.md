# Contributing to MCP Hub 🤝

Thank you for your interest in contributing to MCP Hub! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

### 1. Submit MCP Servers
The easiest way to contribute is by adding your MCP server to the registry:

1. Visit the [Add Server](https://mcp-hub.pages.dev/add) page
2. Fill out the server information form
3. Submit for review
4. Once approved, your server will appear in the registry

### 2. Report Issues
Help us improve by reporting bugs or suggesting features:

- Use the [Issue Tracker](https://github.com/Abdelrahman-sadek/mcp-hub/issues)
- Search existing issues before creating new ones
- Provide detailed information and reproduction steps
- Use appropriate labels (bug, enhancement, documentation, etc.)

### 3. Code Contributions
We welcome code contributions! Here's how to get started:

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Cloudflare account (for testing worker changes)

### Local Development

1. **Fork and Clone**
   ```bash
   git clone https://github.com/Abdelrahman-sadek/mcp-hub.git
   cd mcp-hub
   ```

2. **Set up Worker**
   ```bash
   cd worker
   npm install
   npm run dev
   ```

3. **Set up Dashboard**
   ```bash
   cd ../dashboard
   npm install
   npm run dev
   ```

4. **Run Tests**
   ```bash
   # Worker tests
   cd worker
   npm test

   # Dashboard tests
   cd ../dashboard
   npm test
   ```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting (Prettier configuration)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(worker): add schema federation endpoint
fix(dashboard): resolve mobile navigation issue
docs: update API documentation
test(worker): add health check tests
```

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run all tests
   npm run test:all
   
   # Check code formatting
   npm run lint
   
   # Build to ensure no errors
   npm run build
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/amazing-feature
   ```
   
   Then create a Pull Request on GitHub with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - Test results

### Code Review Process
- All PRs require at least one review
- Address feedback promptly
- Keep PRs focused and reasonably sized
- Ensure CI checks pass

## 🏗️ Architecture Guidelines

### Worker (Backend)
- Keep handlers focused and single-purpose
- Use proper error handling and logging
- Implement rate limiting for new endpoints
- Cache responses when appropriate
- Follow REST API conventions

### Dashboard (Frontend)
- Use React functional components with hooks
- Implement proper error boundaries
- Follow accessibility guidelines (WCAG 2.1)
- Ensure mobile responsiveness
- Use TypeScript for type safety

### Database (KV Storage)
- Use consistent key naming conventions
- Implement proper TTL for cached data
- Handle storage errors gracefully
- Document data structures

## 🧪 Testing Guidelines

### Unit Tests
- Write tests for all new functions
- Aim for >80% code coverage
- Use descriptive test names
- Test both success and error cases

### Integration Tests
- Test API endpoints end-to-end
- Verify database interactions
- Test authentication flows
- Validate error responses

### UI Tests
- Test component rendering
- Verify user interactions
- Test responsive behavior
- Validate accessibility

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for public APIs
- Document complex algorithms
- Include usage examples
- Keep comments up-to-date

### User Documentation
- Update README for new features
- Add API documentation for new endpoints
- Include configuration examples
- Provide troubleshooting guides

## 🔒 Security Guidelines

### General Security
- Never commit secrets or API keys
- Validate all user inputs
- Use HTTPS for all external requests
- Implement proper error handling

### Authentication
- Support secure authentication methods
- Never log or store credentials
- Implement proper session management
- Use secure headers

### Data Privacy
- Minimize data collection
- Implement proper data retention
- Follow GDPR guidelines
- Provide clear privacy policies

## 🚦 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Security review completed
- [ ] Performance testing done

## 🤔 Questions?

- 📖 Check the [Documentation](https://YOUR_USERNAME.github.io/mcp-hub/docs)
- 💬 Start a [Discussion](https://github.com/YOUR_USERNAME/mcp-hub/discussions)
- 🐛 Create an [Issue](https://github.com/YOUR_USERNAME/mcp-hub/issues)
- 📧 Email us at [your-email@example.com](mailto:your-email@example.com)

## 📄 License

By contributing to MCP Hub, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MCP Hub! 🎉

# Contributing to TheLux MCP App

Thank you for your interest in contributing! This guide will help you get started.

## 🤝 How to Contribute

### Reporting Bugs

Found a bug? Please open an issue with:

- **Title**: Clear, descriptive summary
- **Description**: Steps to reproduce, expected vs. actual behavior
- **Environment**: OS, Node version, browser (if applicable)
- **Logs**: Relevant error messages or stack traces

### Suggesting Features

Have an idea? Open an issue with:

- **Use Case**: What problem does this solve?
- **Proposal**: How should it work?
- **Alternatives**: Other approaches you considered

### Submitting Pull Requests

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/mcptheluxapp.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make changes** (see guidelines below)
5. **Test** your changes
6. **Commit**: `git commit -m "Add: your feature description"`
7. **Push**: `git push origin feature/your-feature-name`
8. **Open PR** on GitHub

## 📝 Development Guidelines

### Code Style

- **JavaScript/TypeScript**: Follow existing patterns
- **Formatting**: Use Prettier (run `npm run lint`)
- **Naming**: 
  - Functions: `camelCase`
  - Components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

### Commit Messages

Use conventional commits:

```
feat: Add user authentication
fix: Resolve template search bug
docs: Update installation guide
chore: Upgrade dependencies
refactor: Simplify tool execution logic
test: Add tests for save_page tool
```

### Testing

- Run linter: `npm run lint`
- Build before submitting: `npm run build`
- Manual testing: Start services and test your changes

### Documentation

Update docs when you:
- Add new features
- Change APIs
- Modify configuration
- Update installation steps

## 🏗️ Project Structure

```
mcptheluxapp/
├── apps/web/           # Next.js frontend
│   ├── app/            # App Router pages
│   ├── components/     # React components (to be added)
│   └── api/            # API routes
├── services/mcp/       # MCP service backend
│   └── src/            # Tool implementations
├── sql/                # Database migrations
└── docs/               # Additional documentation
```

## 🧪 Testing Changes

### Local Development

```bash
# Terminal 1: Start dependencies
docker-compose up postgres qdrant minio

# Terminal 2: MCP service
cd services/mcp
npm run dev

# Terminal 3: Web app
cd apps/web
npm run dev
```

### Testing Checklist

- [ ] Changes work locally
- [ ] No console errors
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or documented)

## 🎯 Areas for Contribution

### High Priority

- [ ] Add authentication (Keycloak, Auth0)
- [ ] Build admin panel UI
- [ ] Add user dashboard
- [ ] Implement subdomain routing
- [ ] Add credit/usage tracking

### Medium Priority

- [ ] Improve UI/UX design
- [ ] Add template gallery
- [ ] Create drag-and-drop editor
- [ ] Add more MCP tools
- [ ] Write unit/integration tests

### Documentation

- [ ] Add tutorials
- [ ] Create video guides
- [ ] Improve API examples
- [ ] Add architecture diagrams
- [ ] Write troubleshooting guides

## 🚀 Adding New Features

### Adding a New MCP Tool

1. **Define the tool** (`services/mcp/src/index.js`):

```javascript
async function my_new_tool({ param1, param2 }) {
  // Your implementation
  return { result: 'success' };
}
```

2. **Register the tool** (same file):

```javascript
if (tool === 'my_new_tool') result = await my_new_tool(body);
```

3. **Add to Web app** (`apps/web/app/api/ai/route.ts`):

```typescript
const tools: ToolDef[] = [
  // ...existing tools
  {
    name: 'my_new_tool',
    description: 'What this tool does',
    parameters: {
      type: 'object',
      properties: {
        param1: { type: 'string' },
        param2: { type: 'number' }
      },
      required: ['param1']
    }
  }
];
```

4. **Document it** in `API.md`

### Adding a New Page

1. **Create page** (`apps/web/app/your-page/page.tsx`):

```typescript
export default function YourPage() {
  return <div>Your content</div>;
}
```

2. **Add navigation** (when nav component exists)
3. **Update docs**

## 🔒 Security

### Reporting Vulnerabilities

**Do NOT open a public issue for security vulnerabilities.**

Email: security@thelux.app (or contact maintainers directly)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Best Practices

- Never commit API keys or secrets
- Validate all user inputs
- Use parameterized queries (already done)
- Sanitize output in UI
- Follow OWASP guidelines

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment.

### Expected Behavior

- Be respectful and professional
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

## 🆘 Getting Help

Stuck? Here's how to get help:

1. **Read the docs**: README.md, INSTALLATION.md, ARCHITECTURE.md
2. **Search issues**: Someone may have had the same problem
3. **Ask in discussions**: GitHub Discussions
4. **Open an issue**: Clearly describe your problem

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation (for significant contributions)

## 💬 Questions?

Open a discussion or issue - we're happy to help!

---

Thank you for contributing to TheLux! 🎉

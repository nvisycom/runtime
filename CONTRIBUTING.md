# Contributing

Thank you for your interest in contributing to Nvisy Runtime.

## Requirements

- Node.js 22+
- npm 10+

## Setup

```bash
git clone https://github.com/nvisycom/runtime.git
cd runtime
npm install
npm run build
```

## Development

Run all CI checks locally before submitting a pull request:

```bash
npm run check       # biome lint + format check
npm run typecheck   # tsc --noEmit across all packages
npm test            # vitest
```

To auto-fix lint and formatting issues:

```bash
npm run check:fix
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run `npm run check && npm run typecheck && npm test` to verify all checks pass
5. Submit a pull request

## Project Structure

The monorepo uses npm workspaces. All packages live under `packages/`. See
[packages/readme.md](packages/README.md) for a description of each package.

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all external inputs

## License

By contributing, you agree your contributions will be licensed under the
Apache License 2.0.

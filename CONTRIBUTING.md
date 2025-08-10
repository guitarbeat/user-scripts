# Contributing to Canvas Grading Tools

Thanks for your interest in contributing!

## Ways to contribute
- Report bugs and request features via Issues
- Improve docs (README, docs/)
- Submit pull requests for fixes and enhancements

## Development setup
1. Fork and clone this repository
2. Install dependencies: `npm install`
3. Start development build with watch: `npm run dev`
4. Build for release: `npm run build` (outputs to `dist/`)

## Code guidelines
- Prefer clear names and small, focused modules in `src/`
- Keep UI code in `src/components/`, logic in `src/core/`, helpers in `src/utils/`
- Match existing formatting/style

## Pull requests
- Create a topic branch from `main`
- Keep PRs small and focused
- Describe the change and testing steps
- Link related issues if applicable

## Release notes
- Bump `version` in `package.json` when appropriate
- `npm run build` to generate `dist/canvas-grading-tools.user.js`
- Update `CHANGELOG.md`
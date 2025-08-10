# Development

## Requirements
- Node.js 14+
- npm or yarn

## Scripts
- `npm run dev`: Development build with watch and inline source maps
- `npm run build`: Production build → outputs `dist/canvas-grading-tools.user.js`

## Architecture
```
src/
├── core/         # Controllers and core logic (entry initialization in controller)
├── components/   # UI pieces used by features
├── utils/        # Reusable helpers and DOM utilities
├── styles/       # CSS, loaded via style-loader/css-loader
└── index.js      # Userscript entry; defers init until window load
```

### Entry and initialization
- `src/index.js` listens for `window.load` and calls `init` from `src/core/controller`
- The `@match` pattern and metadata are injected by Webpack's banner step

### Build system
- Webpack 5 with Babel (`@babel/preset-env`) and Terser
- Userscript metadata is injected via `BannerPlugin` and preserved by Terser
- Environment variables available at build time:
  - `process.env.VERSION`
  - `process.env.NODE_ENV`

## Releasing
1. Bump `version` in `package.json`
2. `npm run build`
3. Update `CHANGELOG.md`
4. Share the updated `dist/canvas-grading-tools.user.js`
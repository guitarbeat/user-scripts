# Canvas Grading Tools

A userscript that enhances the Canvas SpeedGrader experience to make grading faster and more consistent.

- **Canvas Filter Tags**: Hide/show rubric blocks, filter by question/section, quick grading panel, submitted files browser, hidden comment boxes, freeze submission details, automatic horizontal view switching
- **Problem Grader (All Students)**: Grade one problem across all students, track progress, navigate quickly, and see a comprehensive multi-student view

## Table of Contents
- [Features](#features)
- [Quick Install](#quick-install)
- [Usage](#usage)
- [Development](#development)
- [Project Structure](#project-structure)
- [Docs](#docs)
- [Contributing](#contributing)
- [License](#license)

## Features
- **Rubric Block Filtering**: Reduce visual clutter by hiding blocks until needed
- **Question/Section Filtering**: Focus the rubric on what you are grading right now
- **Quick Grading Panel**: Grade specific criteria quickly
- **Submitted Files Browser**: Browse/view student submissions more easily
- **Hidden Comment Boxes**: Cleaner UI with comments shown on demand
- **Freeze Submission Details**: Keep important submission info in view
- **Problem Grader**: Grade the same problem across all students for consistency
- **Student Overview & Analytics**: Track problem-specific progress and required files

## Quick Install
1. Install a userscript manager: Tampermonkey (recommended) or Greasemonkey
2. Build this project: `npm install && npm run build`
3. Open `dist/canvas-grading-tools.user.js` and copy its contents
4. In your userscript manager, create a new script and paste the contents
5. Save, then open Canvas SpeedGrader and refresh

## Usage
- This userscript runs on Canvas SpeedGrader pages that match:
  - `https://*.instructure.com/courses/*/gradebook/speed_grader*`
- Open SpeedGrader for an assignment. The enhancements load automatically after the page loads.

## Development
- **Requirements**: Node.js 14+ and npm or yarn
- **Install**: `npm install`
- **Watch / Dev**: `npm run dev`
- **Build**: `npm run build` → outputs `dist/canvas-grading-tools.user.js`

## Project Structure
```
src/
├── components/         # UI components
├── core/               # Core logic and controller
├── utils/              # Utility helpers
├── styles/             # CSS
└── index.js            # Userscript entry
```

## Docs
See the `docs/` folder for more details:
- `docs/features.md`
- `docs/installation.md`
- `docs/development.md`
- `docs/troubleshooting.md`

## Contributing
Contributions are welcome! See `CONTRIBUTING.md` for guidelines.

## License
ISC. See `LICENSE` or `package.json` for details. 
# Installation

1. Install a userscript manager
   - Tampermonkey (recommended) or Greasemonkey
2. Build this project locally
   - `npm install`
   - `npm run build`
3. Copy the built userscript
   - Open `dist/canvas-grading-tools.user.js`
   - Copy the entire file contents
4. Create a new userscript in your manager and paste the contents
5. Save and visit Canvas SpeedGrader

Notes
- The script matches `https://*.instructure.com/courses/*/gradebook/speed_grader*`
- If your Canvas host differs, adjust the `@match` pattern in the built banner
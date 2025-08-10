# Troubleshooting

## Userscript does not run on SpeedGrader
- Ensure the URL matches `https://*.instructure.com/courses/*/gradebook/speed_grader*`
- Confirm the userscript is enabled in your manager
- Reload the page after installation or updates

## Build errors
- Verify Node.js 14+ is installed
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Try a clean build: `npm run build`

## Features not appearing
- Open the browser console for errors
- Confirm you are on a SpeedGrader page (not the main gradebook)
- Some features initialize a few seconds after load; wait briefly or reload
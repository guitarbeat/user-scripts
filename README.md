# Canvas Grading Tools

A collection of userscripts that enhance the Canvas Speed Grader experience, making it easier to grade assignments with complex rubrics and multiple students.

## Features

### Canvas Filter Tags
- **Rubric Block Filtering**: Hide/show rubric blocks by default to reduce visual clutter
- **Question/Section Filtering**: Filter the rubric to focus on specific questions or sections
- **Quick Grading Panel**: Grade specific criteria more efficiently
- **Submitted Files Browser**: Easily browse and view submitted files
- **Hidden Comment Boxes**: Hide comment boxes by default for a cleaner interface
- **Freeze Submission Details**: Lock the submission details panel in place for easier scrolling

### Problem Grader (All Students)
- **Grade By Problem**: Focus on grading one problem across all students for consistency
- **Student Overview**: Track grading progress for specific problems
- **File Submission Analytics**: View which students have submitted required files
- **Quick Navigation**: Jump directly to a student's submission for a specific problem
- **Comprehensive View**: See all problems across all students in one view

## Installation

1. Install a userscript manager like Tampermonkey or Greasemonkey in your browser
2. Build the script by running `npm run build`
3. Copy the contents of the `dist/canvas-grading-tools.user.js` file
4. Create a new userscript in your userscript manager and paste the contents
5. Save the script and refresh your Canvas Speed Grader page

## Development

### Requirements
- Node.js 14+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Build the script
npm run build

# Watch for changes during development
npm run dev
```

## Project Structure
```
src/
├── components/         # UI components
├── core/               # Core logic and data processing
├── utils/              # Utility functions
├── styles/             # CSS stylesheets
└── index.js            # Main entry point
```

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License. 
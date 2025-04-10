import { init } from './core/controller';

/**
 * Canvas Grading Tools Userscript
 * 
 * This userscript adds functionality to Canvas Speed Grader to enhance the grading experience:
 * - Automatically switches to horizontal view mode
 * - Click-to-show rubric blocks (defaults to all hidden)
 * - Filtering by question/section
 * - Quick grading panel
 * - Submitted files browser
 * - Hidden comment boxes by default
 */

(function() {
  "use strict";
  
  window.addEventListener("load", () => {
    setTimeout(init, 3000);
  });
})(); 
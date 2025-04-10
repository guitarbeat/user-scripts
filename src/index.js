import { init } from './core/controller';

/**
 * Canvas Grading Tools
 * 
 * This userscript enhances the Canvas Speed Grader experience with features
 * designed to make the grading process more efficient and consistent.
 * 
 * Features include:
 * - Click-to-show rubric blocks (defaults to all hidden)
 * - Filtering by question/section
 * - Quick grading panel
 * - Submitted files browser
 * - Hidden comment boxes by default
 * - Problem grader for grading specific problems across all students
 * - Student overview for tracking problem-specific grading progress
 * - File submission analytics and requirement validation
 * - Freeze submission details panel for easier scrolling
 * - Automatic horizontal view switching
 */

(function() {
  "use strict";
  
  window.addEventListener("load", () => {
    setTimeout(init, 3000);
  });
})(); 
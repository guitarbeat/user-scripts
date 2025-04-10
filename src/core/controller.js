import log from '../utils/logger';
import { waitForElement, removeOldFilterUI, hideAllRubricBlocks, hideAllCommentBoxes, defer } from '../utils/dom';
import { extractFilterTags, extractRubricData } from './rubricData';
import { createTagUI } from '../components/filterUI';
import { createFilesBrowserUI } from '../components/filesBrowser';
import { createHorizontalViewUI } from '../components/horizontalView';
import { createProblemGraderButton } from '../components/problemGraderUI';
import { createFreezeSubmissionDetailsUI } from '../components/freezeSubmissionDetails';
import { initStyles } from '../styles';

/**
 * Refreshes the rubric filter UI when the student changes
 */
export const refreshRubricFilter = () => {
  log("🔄 Student changed. Refreshing rubric filters...");
  removeOldFilterUI();
  const gradePanel = document.querySelector("#rubric-grade-panel");
  if (gradePanel) {
    gradePanel.remove();
  }

  // Remove file browser panel as well
  const filePanel = document.querySelector("#file-browser-panel");
  if (filePanel) {
    filePanel.remove();
  }

  setTimeout(() => {
    const tags = extractFilterTags();
    // Re-extract rubric data when student changes to ensure data is fresh
    extractRubricData();
    createTagUI(tags);
    createFilesBrowserUI();
    createProblemGraderButton(); // Recreate problem grader button when student changes
    hideAllRubricBlocks();
    hideAllCommentBoxes();
  }, 1000); // delay to allow rubric to re-render
};

/**
 * Sets up listeners for student changes
 */
export const setupStudentChangeListener = () => {
  const nextBtn = document.querySelector("i.icon-arrow-right.next");

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      refreshRubricFilter();
    });
  }

  // Fallback: observe dropdown for selection changes
  const observer = new MutationObserver(() => {
    refreshRubricFilter();
  });

  const studentLabel = document.querySelector(".ui-selectmenu-button");
  if (studentLabel) {
    observer.observe(studentLabel, { childList: true, subtree: true });
  }
};

/**
 * Initializes the Canvas Grading Tools userscript
 */
export const init = () => {
  log("🔄 Initializing Canvas Grading Tools...");
  
  // Initialize styles first
  initStyles();
  
  // Wait for rubric blocks to load
  log("🔄 Waiting for rubric blocks...");
  waitForElement("div.css-ihzx28-view", () => {
    log("✅ Rubric blocks ready. Initializing components...");
    const tags = extractFilterTags();
    extractRubricData(); // Extract and store detailed rubric data
    createTagUI(tags);
    createFilesBrowserUI();
    createProblemGraderButton(); // Add problem grader button
    hideAllRubricBlocks(); // hide all by default
    hideAllCommentBoxes(); // also hide all comments initially
    setupStudentChangeListener();
    
    // Initialize the submission details freezing
    createFreezeSubmissionDetailsUI();
    
    // Initialize the horizontal view switcher
    defer(() => {
      createHorizontalViewUI();
    });
  });
}; 
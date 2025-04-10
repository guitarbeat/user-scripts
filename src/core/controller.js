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
  
  // Remove existing filter UI
  removeOldFilterUI();

  // Remove the grade panel if it exists
  const gradePanel = document.querySelector("#rubric-grade-panel");
  if (gradePanel) {
    gradePanel.remove();
    log("✅ Removed existing grade panel.");
  } else {
    log("⚠️ No grade panel found to remove.");
  }

  // Remove the file browser panel if it exists
  const filePanel = document.querySelector("#file-browser-panel");
  if (filePanel) {
    filePanel.remove();
    log("✅ Removed existing file browser panel.");
  } else {
    log("⚠️ No file browser panel found to remove.");
  }

  // Use a MutationObserver to wait for the rubric to re-render
  const observer = new MutationObserver((mutationsList, observer) => {
    const tags = extractFilterTags();
    if (tags.size > 0) {
      log(`✅ Extracted ${tags.size} tags from rubric blocks.`);
      extractRubricData(); // Refresh rubric data
      createTagUI(tags);
      createFilesBrowserUI();
      createProblemGraderButton(); // Recreate problem grader button
      hideAllRubricBlocks();
      hideAllCommentBoxes();
      observer.disconnect(); // Stop observing once done
    } else {
      log("⚠️ No rubric blocks found after re-render.");
    }
  });

  // Start observing for changes in the rubric container
  const rubricContainer = document.querySelector('.rubric-container'); // Adjust selector as needed
  if (rubricContainer) {
    observer.observe(rubricContainer, { childList: true, subtree: true });
    log("🔍 Observing changes in the rubric container...");
  } else {
    log("⚠️ Rubric container not found. Unable to observe changes.");
  }
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
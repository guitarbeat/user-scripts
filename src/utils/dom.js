import log from './logger';

/**
 * Waits for an element to appear in the DOM before executing a callback
 * @param {string} selector - CSS selector to find element
 * @param {Function} callback - Function to call when element is found
 * @param {number} maxTries - Maximum number of times to check for element
 * @param {number} interval - Milliseconds between checks
 */
export const waitForElement = (
  selector,
  callback,
  maxTries = 50,
  interval = 300
) => {
  let tries = 0;
  const check = () => {
    const el = document.querySelector(selector);
    if (el) {
      return callback(el);
    }
    if (++tries < maxTries) {
      setTimeout(check, interval);
    } else {
      log(`❌ Gave up waiting for ${selector}`);
    }
  };
  check();
};

/**
 * Waits for jQuery to be loaded before executing method
 * @param {Function} method Function to execute when jQuery is available
 */
export function defer(method) {
  if (typeof $ !== 'undefined') {
    method();
  } else {
    setTimeout(() => defer(method), 100);
  }
}

/**
 * Hides all rubric blocks in the DOM
 */
export const hideAllRubricBlocks = () => {
  const all = document.querySelectorAll("div.css-ihzx28-view");
  all.forEach((el) => (el.style.display = "none"));

  const hrSeparators = document.querySelectorAll("hr.css-70q7z4-view");
  hrSeparators.forEach((el) => (el.style.display = "none"));

  const gradePanel = document.querySelector("#rubric-grade-panel");
  if (gradePanel) {
    gradePanel.remove();
  }
};

/**
 * Shows specific rubric blocks
 * @param {Array} blocks - Array of DOM elements to show
 */
export const showRubricBlocks = (blocks) => {
  blocks.forEach((el) => {
    el.style.display = "";

    const prev = el.previousElementSibling;
    const next = el.nextElementSibling;

    if (
      prev &&
      prev.tagName === "HR" &&
      prev.classList.contains("css-70q7z4-view")
    ) {
      prev.style.display = "";
    }

    if (
      next &&
      next.tagName === "HR" &&
      next.classList.contains("css-70q7z4-view")
    ) {
      next.style.display = "";
    }
  });

  // The grade panel creation will be handled by the caller
  // to avoid circular dependencies
};

/**
 * Shows all rubric blocks in the DOM
 */
export const showAllRubricBlocks = () => {
  document.querySelectorAll("div.css-ihzx28-view").forEach((el) => {
    el.style.display = "";
  });

  document.querySelectorAll("hr.css-70q7z4-view").forEach((el) => {
    el.style.display = "";
  });

  const gradePanel = document.querySelector("#rubric-grade-panel");
  if (gradePanel) {
    gradePanel.remove();
  }
};

/**
 * Hides all comment boxes in the DOM
 */
export const hideAllCommentBoxes = () => {
  const comments = document.querySelectorAll(
    "span.css-j68kdy-formFieldLabel"
  );
  comments.forEach((label) => {
    const container = label.closest("div");
    if (container) {
      container.style.display = "none";
    }
  });
};

/**
 * Shows all comment boxes in the DOM
 */
export const showAllCommentBoxes = () => {
  const comments = document.querySelectorAll(
    "span.css-j68kdy-formFieldLabel"
  );
  comments.forEach((label) => {
    const container = label.closest("div");
    if (container) {
      container.style.display = "";
    }
  });
};

/**
 * Removes the filter UI panel if it exists
 */
export const removeOldFilterUI = () => {
  const existing = document.querySelector("#rubric-filter-panel");
  if (existing) {
    existing.remove();
  }
};

/**
 * Creates a stylesheet with the given CSS and appends it to the document head
 * @param {string} css - CSS content to add
 * @returns {HTMLStyleElement} - The created style element
 */
export const createStyleSheet = (css) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}; 
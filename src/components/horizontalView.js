/**
 * Auto-switches Canvas SpeedGrader rubric view to horizontal
 * Adapted from startup.user.js
 */
import log from '../utils/logger';

// Utility functions
const simulateClick = (el) => {
  if (!el) {
    return;
  }
  ['mousedown', 'mouseup', 'click'].forEach(type => {
    el.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  });
};

const retryUntilFound = (selector, callback, maxAttempts = 30, interval = 500, label = selector) => {
  let attempts = 0;
  const tryFind = () => {
    const el = document.querySelector(selector);
    if (el) {
      log(`✅ Found: ${label}`);
      callback(el);
    } else if (attempts < maxAttempts) {
      attempts++;
      if (attempts % 5 === 0) {
        log(`⏳ Waiting for ${label} (attempt ${attempts})...`);
      }
      setTimeout(tryFind, interval);
    } else {
      log(`❌ Gave up waiting for ${label}`);
    }
  };
  tryFind();
};

const spamKeyUntilInputAppears = (key, inputSelector, callback, maxAttempts = 30, interval = 500) => {
  let attempts = 0;

  const trySend = () => {
    const input = document.querySelector(inputSelector);
    if (input) {
      log(`✅ Rubric panel is open.`);
      callback(input);
      return;
    }

    if (attempts >= maxAttempts) {
      log(`❌ Gave up sending "${key}" keypress after ${maxAttempts} tries.`);
      return;
    }

    attempts++;
    if (attempts % 5 === 0) {
      log(`⌨️ Sending "${key}" keypress (attempt ${attempts})...`);
    }

    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      code: `Key${key.toUpperCase()}`,
      keyCode: key.toUpperCase().charCodeAt(0),
      which: key.toUpperCase().charCodeAt(0)
    });
    document.dispatchEvent(event);

    setTimeout(trySend, interval);
  };

  trySend();
};

const waitForDropdownThenClick = () => {
  retryUntilFound("input#Select_1", (input) => {
    // Check if already set to Horizontal
    const isAlreadyHorizontal = input?.value?.toLowerCase().includes("horizontal") || input?.ariaLabel?.includes("Horizontal");

    if (isAlreadyHorizontal) {
      log("✅ Rubric already set to horizontal. No action needed.");
      return;
    }

    log("🔽 Clicking rubric view dropdown input...");
    simulateClick(input);

    setTimeout(() => {
      retryUntilFound("[data-testid='horizontal-view-option']", (option) => {
        log("➡️ Clicking 'Horizontal' option...");
        simulateClick(option);
        
        // Show success toast
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:10px 20px;border-radius:4px;box-shadow:0 2px 5px rgba(0,0,0,0.2);z-index:9999;';
        toast.textContent = 'Switched to horizontal view';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        
      }, 30, 400, "Horizontal dropdown option");
    }, 300); // Wait for dropdown menu to render
  }, 40, 500, "View mode input");
};

/**
 * Initializes the auto horizontal view switcher
 */
export const createHorizontalViewUI = () => {
  log("🔄 Initializing automatic horizontal view switcher...");
  
  // Wait for rubric table to load
  retryUntilFound(".rubric_table", () => {
    log("✅ Rubric table detected. Repeatedly sending 'r' to open rubric panel...");

    spamKeyUntilInputAppears("r", "input#Select_1", () => {
      waitForDropdownThenClick();
    }, 30, 500);
  });
} 
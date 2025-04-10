/**
 * Waits for an element to appear in the DOM before executing a callback
 * @param {string} selector CSS selector to wait for
 * @param {Function} callback Function to execute when element appears
 * @param {number} timeout Optional timeout in ms before giving up
 */
export function waitForElement(selector, callback, timeout = 10000) {
  const startTime = Date.now();
  
  function checkElement() {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      return;
    }
    
    if (timeout && Date.now() - startTime > timeout) {
      console.warn(`Timeout waiting for element: ${selector}`);
      return;
    }
    
    setTimeout(checkElement, 100);
  }
  
  checkElement();
}

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
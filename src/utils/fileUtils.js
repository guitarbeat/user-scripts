/**
 * Utility functions for file operations
 */

/**
 * Creates and triggers a download for text content
 * @param {Array<string>} textArray Array of text strings to save
 * @param {string} fileName Name for the downloaded file
 */
export function saveText(textArray, fileName) {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  
  const blob = new Blob(textArray, {type: "text"});
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}

/**
 * Encodes a string for CSV format, adding quotes if needed
 * @param {string} string Text to encode for CSV
 * @returns {string} CSV-encoded string
 */
export function csvEncode(string) {
  if (string && (string.includes('"') || string.includes(','))) {
    return '"' + string.replace(/"/g, '""') + '"';
  }
  return string;
} 
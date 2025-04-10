/**
 * Utility functions for creating and managing dialog boxes
 */

/**
 * Shows a dialog with a message and an OK button
 * @param {string} id Element ID for the dialog container
 * @param {string} text Message to display in the dialog
 * @param {Function} callback Optional callback when dialog is closed
 */
export function showDialog(id, text, callback) {
  // Create dialog element if it doesn't exist
  if (!document.getElementById(id.replace('#', ''))) {
    const dialogEl = document.createElement('div');
    dialogEl.id = id.replace('#', '');
    dialogEl.title = "Canvas Tools";
    document.body.appendChild(dialogEl);
  }
  
  // If jQuery UI is available, use it; otherwise use basic dialog
  if (typeof $ !== 'undefined' && $.fn.dialog) {
    $(id).html(`<p>${text}</p>`);
    $(id).dialog({
      buttons: {
        Ok: function() {
          $(this).dialog("close");
          if (callback) {
            callback();
          }
        }
      }
    }).dialog("open");
  } else {
    const el = document.querySelector(id);
    el.innerHTML = `<div class="dialog-content"><p>${text}</p><button>OK</button></div>`;
    el.style.display = 'block';
    
    const button = el.querySelector('button');
    button.addEventListener('click', () => {
      el.style.display = 'none';
      if (callback) {
        callback();
      }
    });
  }
}

/**
 * Closes a dialog
 * @param {string} id Element ID for the dialog container
 */
export function closeDialog(id) {
  if (typeof $ !== 'undefined' && $.fn.dialog) {
    $(id).dialog("close");
  } else {
    const el = document.querySelector(id);
    if (el) {
      el.style.display = 'none';
    }
  }
} 
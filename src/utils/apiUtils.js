/**
 * Utility functions for interacting with the Canvas API
 */

/**
 * Get the assignment ID from the current URL
 * @returns {string} Assignment ID
 */
export function getAssignmentId() {
  const urlParams = window.location.href.split('?')[1].split('&');
  for (const param of urlParams) {
    if (param.split('=')[0] === "assignment_id") {
      return param.split('=')[1];
    }
  }
  return null;
}

/**
 * Get the course ID from the current URL
 * @returns {string} Course ID
 */
export function getCourseId() {
  return window.location.href.split('/')[4];
}

/**
 * Fetches all pages of an API endpoint
 * @param {string} url API URL to fetch
 * @param {Function} callback Function to call with complete results
 */
export function getAllPages(url, callback) {
  getRemainingPages(url, [], callback);
}

/**
 * Recursive helper function for getAllPages
 * @param {string} nextUrl Next URL to fetch
 * @param {Array} listSoFar Accumulated results
 * @param {Function} callback Function to call with complete results
 */
function getRemainingPages(nextUrl, listSoFar, callback) {
  fetch(nextUrl)
    .then(response => {
      const linkHeader = response.headers.get('link');
      let nextLink = null;
      
      if (linkHeader) {
        const links = linkHeader.split(',');
        for (const link of links) {
          if (link.split(';')[1].includes('rel="next"')) {
            nextLink = link.split(';')[0].slice(1, -1);
          }
        }
      }
      
      return response.json().then(data => ({
        data,
        nextLink
      }));
    })
    .then(({ data, nextLink }) => {
      const newList = [...listSoFar, ...data];
      
      if (nextLink) {
        getRemainingPages(nextLink, newList, callback);
      } else {
        callback(newList);
      }
    })
    .catch(error => {
      console.error("Error fetching API data:", error);
      callback(listSoFar); // Return what we have so far
    });
}

/**
 * Shows a progress bar dialog
 * @param {number} amount Progress percentage (0-100)
 * @param {string} progressId ID of the progress element
 * @param {string} dialogId ID of the dialog element
 */
export function showProgress(amount, progressId = 'progress_bar', dialogId = 'progress_dialog') {
  if (typeof $ !== 'undefined' && $.fn.progressbar) {
    $(`#${progressId}`).progressbar({ value: amount });
    
    if (amount === 100) {
      $(`#${dialogId}`).dialog("close");
    } else {
      $(`#${dialogId}`).dialog("open");
    }
  } else {
    const progressEl = document.getElementById(progressId);
    if (progressEl) {
      progressEl.style.width = `${amount}%`;
    }
    
    const dialogEl = document.getElementById(dialogId);
    if (dialogEl) {
      dialogEl.style.display = amount === 100 ? 'none' : 'block';
    }
  }
}

/**
 * Sends a batch of API requests with throttling
 * @param {Array} requests Array of request objects
 * @param {Function} successCallback Function to call on overall success
 * @param {Function} errorCallback Function to call with errors
 * @param {string} progressId ID for the progress bar element
 * @param {string} dialogId ID for the progress dialog element
 */
export function sendRequests(requests, successCallback, errorCallback, progressId = 'progress_bar', dialogId = 'progress_dialog') {
  const errors = [];
  let completed = 0;
  const chunkSize = 10;
  
  function sendChunk(i) {
    const chunk = requests.slice(i, i + chunkSize);
    
    const promises = chunk.map(request => 
      fetch(request.url, request.options || {})
        .then(response => {
          if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
          }
          return response;
        })
        .catch(error => {
          errors.push(`${request.error || 'Error'}: ${error.message}\n`);
          throw error;
        })
    );
    
    Promise.allSettled(promises)
      .then(() => {
        completed += chunk.length;
        showProgress(Math.min(100, Math.round(completed * 100 / requests.length)), progressId, dialogId);
        
        if (i + chunkSize < requests.length) {
          setTimeout(() => sendChunk(i + chunkSize), 1000);
        } else if (completed >= requests.length) {
          if (errors.length > 0) {
            errorCallback(errors);
          } else {
            successCallback();
          }
        }
      });
  }
  
  sendChunk(0);
} 
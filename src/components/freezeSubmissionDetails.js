import log from '../utils/logger';
import { waitForElement } from '../utils/dom';

/**
 * Freezes the submission details panel in place for easier scrolling
 */
export const createFreezeSubmissionDetailsUI = () => {
  log('🔍 Initializing Freeze Submission Details...');
  
  waitForElement('#submission_details', (details) => {
    log('✅ Found submission details panel, freezing in place');
    
    // Add our custom class to apply common styles
    details.classList.add('canvas-tool-panel');
    
    Object.assign(details.style, {
      position: 'fixed',
      top: '80px',
      right: '20px',
      width: '300px',
      padding: '10px',
      zIndex: 9999
    });
  });
}; 
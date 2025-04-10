import log from '../utils/logger';
import { waitForElement } from '../utils/waitForElement';
import { createStyleSheet } from '../utils/dom';

/**
 * Function to extract all students from the dropdown
 */
export const getStudentList = () => {
  const studentSelect = document.querySelector('#students_selectmenu');
  if (!studentSelect) {
    return [];
  }

  return Array.from(studentSelect.querySelectorAll('option')).map(option => ({
    id: option.value,
    name: option.textContent.trim(),
    selected: option.selected
  }));
};

/**
 * Function to extract all question blocks from the current rubric
 */
export const extractQuestionBlocks = () => {
  const blocks = Array.from(document.querySelectorAll('div.css-ihzx28-view'));
  const questionMap = new Map();

  blocks.forEach(block => {
    const text = block.innerText.trim();
    const match = text.match(/Question\s+\d+[a-z]?|Part\s+[a-z]:/i);
    const tag = match ? match[0].trim() : 'Other';

    // Get criterion title - first line of the block
    const criterionTitle = text.split('\n')[0]?.trim() || tag;

    if (!questionMap.has(tag)) {
      questionMap.set(tag, {
        tag,
        criterionTitle,
        blocks: []
      });
    }
    questionMap.get(tag).blocks.push(block);
  });

  return Array.from(questionMap.values());
};

/**
 * Function to get rating buttons for a block
 */
export const getRatingButtonsForBlock = (block) => {
  return Array.from(block.querySelectorAll('[data-testid^="rubric-rating-button-"]:not([data-testid="rubric-rating-button-selected"])'))
    .filter(btn => btn.getAttribute('data-testid').match(/rubric-rating-button-\d+/));
};

/**
 * Function to get current selected rating for a block
 */
export const getSelectedRatingForBlock = (block) => {
  const selectedIndicator = block.querySelector('[data-testid="rubric-rating-button-selected"]');
  if (!selectedIndicator) {
    return null;
  }

  const selectedElement = selectedIndicator.closest('[data-testid^="rubric-rating-button-"]');
  if (!selectedElement) {
    return null;
  }

  const ratingId = selectedElement.getAttribute('data-testid')?.replace('rubric-rating-button-', '');
  const ratingContainer = selectedElement.closest('[data-testid^="rating-button-"]');
  const ariaLabel = ratingContainer?.getAttribute('aria-label');
  const pointsMatch = ariaLabel?.match(/\((\d+)(?:-\d+)? Points?\)/);
  const points = pointsMatch ? pointsMatch[1] : null;
  const description = ariaLabel?.split('Points)')[1]?.trim() || '';

  return {
    ratingId,
    points,
    description,
    element: selectedElement
  };
};

/**
 * Function to highlight and scroll to the specified rubric blocks for grading
 */
export const showRubricBlocks = (blocks) => {
  if (!blocks || blocks.length === 0) {
    return;
  }

  // Reset any previous highlights
  document.querySelectorAll('div.css-ihzx28-view').forEach(block => {
    block.style.border = '';
    block.style.boxShadow = '';
  });

  // Highlight the specified blocks
  blocks.forEach(block => {
    block.style.border = '2px solid #0374B5';
    block.style.boxShadow = '0 0 8px rgba(3, 116, 181, 0.4)';
  });

  // Scroll to the first block
  blocks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
}; 
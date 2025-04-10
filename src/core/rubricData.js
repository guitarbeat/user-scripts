import log from '../utils/logger';

/**
 * Extracts tags from rubric blocks for filtering
 * @returns {Map} Map of tags to associated blocks
 */
export const extractFilterTags = () => {
  const blocks = Array.from(document.querySelectorAll("div.css-ihzx28-view"));
  const tagMap = new Map();

  blocks.forEach((block) => {
    const text = block.innerText.trim();
    
    // Try multiple pattern matching approaches in order of specificity
    let tag = null;
    
    // Pattern 1: Question X or Part X format
    const questionPartMatch = text.match(
      /Question\s+\d+[a-z]?|Part\s+[a-z]:|Part\s+\d+[a-z]?/i
    );
    
    // Pattern 2: Numbered list items (e.g., "1. Code Functionality")
    const numberedItemMatch = text.match(/^\s*(\d+\.\s*[\w\s]+)/);
    
    // Pattern 3: Lettered items (e.g., "a) Analysis")
    const letteredItemMatch = text.match(/^\s*([a-z]\)\s*[\w\s]+)/i);
    
    // Pattern 4: Specific content patterns from the rubric
    const contentPatternMatch = text.match(
      /Number of [\w\s]+|Maximum [\w\s]+|of the ADC[\w\s()]*|A Channels[\w\s()]*|Part f:[\w\s()]*/i
    );
    
    // Pattern 5: Section headings (often have point values in parentheses)
    const sectionHeadingMatch = text.match(
      /([A-Za-z][\w\s,]+\(\d+\s*Points?\))/
    );
    
    // Pattern 6: Try to extract first line if it's not too long or too short
    const firstLineMatch = text.split('\n')[0]?.trim();
    const isReasonableFirstLine = firstLineMatch && 
                                 firstLineMatch.length > 5 && 
                                 firstLineMatch.length < 60 &&
                                 !firstLineMatch.includes("Instructor Points out of");
    
    // Use the first matching pattern we find
    if (questionPartMatch) {
      tag = questionPartMatch[0].trim();
    } else if (numberedItemMatch) {
      tag = numberedItemMatch[1].trim();
    } else if (letteredItemMatch) {
      tag = letteredItemMatch[1].trim();
    } else if (contentPatternMatch) {
      tag = contentPatternMatch[0].trim();
    } else if (sectionHeadingMatch) {
      tag = sectionHeadingMatch[1].trim();
    } else if (isReasonableFirstLine) {
      // Use a snippet of the first line if it's reasonable
      tag = firstLineMatch.length > 30 ? 
            `${firstLineMatch.substring(0, 27)}...` : 
            firstLineMatch;
    } else {
      // Default fallback
      tag = "Other";
    }
    
    // Try to extract a question number if we have a tag that doesn't have one
    if (!tag.match(/\d+/) && !tag.match(/^Other$/)) {
      // Look for any question number in the text
      const numberMatch = text.match(/Question\s+(\d+)|#(\d+)|^(\d+)[.:]|Problem\s+(\d+)/i);
      if (numberMatch) {
        const number = numberMatch[1] || numberMatch[2] || numberMatch[3] || numberMatch[4];
        if (number) {
          tag = `Q${number}: ${tag}`;
        }
      }
    }
    
    // Normalize the tag format for consistency
    tag = tag.replace(/^Question\s+(\d+)/i, 'Q$1')
             .replace(/^(\d+)\.\s*/, 'Q$1: ')
             .replace(/^Part\s+([a-z]):/i, 'Part $1:');
    
    if (!tagMap.has(tag)) {
      tagMap.set(tag, []);
    }
    tagMap.get(tag).push(block);
  });

  return tagMap;
};

/**
 * Gets point value from a rubric block
 * @param {Element} block - Rubric block element
 * @returns {number|null} Point value or null if not found
 */
export const getPointsFromBlock = (block) => {
  // Find selected rating button with data-testid="rubric-rating-button-selected"
  const selectedIndicator = block.querySelector(
    '[data-testid="rubric-rating-button-selected"]'
  );
  if (!selectedIndicator) {
    return null;
  }

  // Get the parent container with the aria-label
  const ratingContainer = selectedIndicator.closest(
    '[data-testid^="rating-button-"]'
  );
  if (!ratingContainer) {
    return null;
  }

  // Extract points from aria-label
  const ariaLabel = ratingContainer.getAttribute("aria-label");
  const pointsMatch = ariaLabel?.match(/\((\d+)(?:-\d+)? Points?\)/);
  return pointsMatch ? pointsMatch[1] : null;
};

/**
 * Calculates total points for an array of blocks
 * @param {Array} blocks - Array of block elements
 * @returns {Object} Object with total points, graded count, and total blocks count
 */
export const getTotalPoints = (blocks) => {
  let total = 0;
  let graded = 0;

  blocks.forEach((block) => {
    const points = getPointsFromBlock(block);
    if (points) {
      total += parseInt(points, 10);
      graded++;
    }
  });

  return { total, graded, total_blocks: blocks.length };
};

/**
 * Finds a Canvas button for a specific rating point value
 * @param {Element} block - Rubric block element
 * @param {number} pointValue - Point value to find
 * @returns {Element|null} Button element or null if not found
 */
export const findCanvasButtonForRating = (block, pointValue) => {
  const allButtons = Array.from(
    block.querySelectorAll(
      '[data-testid^="rubric-rating-button-"]:not([data-testid="rubric-rating-button-selected"])'
    )
  );

  for (const btn of allButtons) {
    const container = btn.closest('[data-testid^="rating-button-"]');
    if (!container) {
      continue;
    }

    const ariaLabel = container.getAttribute("aria-label");
    const pointsMatch = ariaLabel?.match(/\((\d+)(?:-\d+)? Points?\)/);
    const points = pointsMatch ? pointsMatch[1] : null;

    if (points && parseInt(points, 10) === pointValue) {
      return btn;
    }
  }

  return null;
};

/**
 * Tries to get rubric data from Canvas's internal structures
 * @returns {Object|null} Canvas rubric data or null if not found
 */
export const tryGetCanvasRubricData = () => {
  try {
    // Try to access the assessment data from Canvas's ENV variable
    if (window.ENV?.RUBRIC_ASSESSMENT) {
      return window.ENV.RUBRIC_ASSESSMENT;
    }

    // Try to find rubric data in the window object
    if (window.rubricAssessment) {
      return window.rubricAssessment;
    }

    // Look for data-rubric-assessment attributes
    const rubricElements = document.querySelectorAll(
      "[data-rubric-assessment]"
    );
    if (rubricElements.length > 0) {
      try {
        const jsonData = rubricElements[0].getAttribute(
          "data-rubric-assessment"
        );
        if (jsonData) {
          return JSON.parse(jsonData);
        }
      } catch (e) {
        log("Error parsing rubric assessment JSON:", e);
      }
    }

    return null;
  } catch (e) {
    log("Error accessing Canvas rubric data:", e);
    return null;
  }
};

/**
 * Extracts detailed data about rubric elements
 * @returns {Array} Array of rubric data objects
 */
export const extractRubricData = () => {
  const rubricBlocks = document.querySelectorAll("div.css-ihzx28-view");
  log(`Found ${rubricBlocks.length} rubric blocks to analyze`);

  // Try to get the rubric data directly from Canvas if possible
  const canvasRubricData = tryGetCanvasRubricData();

  // Find any section headings or dividers that might indicate section grouping
  const sectionHeadings = [];
  let currentSection = '';
  
  // Look for section headings in the DOM that aren't part of rubric blocks
  // Canvas often uses heading elements or specific divs for section titles
  document.querySelectorAll('h2, h3, h4, .rubric-criterion-group, .criterion_group_title').forEach(heading => {
    const headingText = heading.innerText.trim();
    if (
      headingText && 
      headingText.length > 3 && 
      !headingText.includes('Total Points') &&
      !headingText.includes('Instructor Points')
    ) {
      sectionHeadings.push({
        element: heading,
        text: headingText
      });
    }
  });

  // Extract any criteria groupings from Canvas data model if available
  if (canvasRubricData && canvasRubricData.rubric && canvasRubricData.rubric.criteria_groups) {
        Object.entries(canvasRubricData.rubric.criteria_groups).forEach(([groupId, group]) => {
          if (group && group.name) {
            sectionHeadings.push({
              groupId,
              text: group.name
            });
          }
        });
  }

  const rubricData = [];

  rubricBlocks.forEach((block, index) => {
    try {
      // Extract title/criterion name - but avoid the generic "Instructor Points out of X" text
      let titleText =
        block.innerText.split("\n")[0]?.trim() || `Item ${index + 1}`;

      // Try to find the actual question title (like "Code Modification and Functionality (10 Points)")
      // First look for section titles with point values
      const sectionTitleMatch = block.innerText.match(
        /([A-Za-z][\w\s,]+\([0-9]+\s*Points?\))/
      );
      if (sectionTitleMatch) {
        titleText = sectionTitleMatch[1].trim();
      }

      // Also try to match patterns like "1. Code Modification and Functionality (10 Points)"
      const numberedSectionMatch = block.innerText.match(
        /(\d+\.\s*[A-Za-z][\w\s,]+\([0-9]+\s*Points?\))/
      );
      if (numberedSectionMatch) {
        titleText = numberedSectionMatch[1].trim();
      }

      // Skip generic "Instructor Points out of X" titles
      if (titleText.includes("Instructor Points out of")) {
        // Look deeper into the block for a better title
        const allTextBlocks = Array.from(block.querySelectorAll("div"))
          .map((div) => div.innerText.trim())
          .filter(
            (text) =>
              text.length > 10 && !text.includes("Instructor Points out of")
          );

        // Find a text block that looks like a title (shorter, with points)
        const titleCandidate = allTextBlocks.find(
          (text) =>
            text.includes("Points") &&
            text.length < 100 &&
            !text.includes("Instructor Points out of")
        );

        if (titleCandidate) {
          titleText = titleCandidate;
        }
      }

      // Try to get data from actual Canvas rubric if available
      let criterionId = "";
      if (canvasRubricData) {
        // Try to find a data-criterion-id attribute on this block or its children
        for (const el of [
          block,
          ...Array.from(block.querySelectorAll("[data-criterion-id]")),
        ]) {
          const id = el.getAttribute("data-criterion-id");
          if (id) {
            criterionId = id;
            break;
          }
        }

        // If we found an ID, look for this criterion in Canvas's data
        if (criterionId && canvasRubricData.rubric_assessment) {
          const criterionData =
            canvasRubricData.rubric_assessment[criterionId];
          if (criterionData?.description) {
            titleText = criterionData.description;
          }
        }
      }

      // Try to extract the question content from the criterion
      // First check if there's a question heading within the block
      let questionHeading = "";
      let questionContent = "";

      // Look for divs with substantial text content that aren't generic rating labels
      const contentDivs = Array.from(block.querySelectorAll("div")).filter(
        (div) =>
          div.innerText &&
          div.innerText.length > 15 &&
          div.innerText.length < 200 &&
          !div.innerText.includes("Instructor Points out of") &&
          !div.innerText.includes("pts") &&
          !div.innerText.includes("Points")
      );

      // For Canvas installations that have specific HTML structures for questions
      // Try looking for parent elements with titles
      const parentElements = [
        block.parentElement,
        block.parentElement?.parentElement,
      ];
      parentElements.forEach((parent) => {
        if (parent) {
          const potentialTitle = parent.querySelector(
            ".criterion_description_label"
          );
          if (
            potentialTitle?.innerText &&
            !potentialTitle.innerText.includes("Instructor Points")
          ) {
            questionHeading = potentialTitle.innerText.trim();
          }
        }
      });

      // Look for spans that might contain the actual criterion title
      const titleSpans = Array.from(block.querySelectorAll("span")).filter(
        (span) =>
          span.innerText &&
          span.innerText.length > 10 &&
          span.innerText.length < 100 &&
          !span.innerText.includes("Instructor Points out of") &&
          (span.innerText.includes("Points") ||
            span.innerText.includes("pts"))
      );

      if (titleSpans.length > 0) {
        questionHeading = titleSpans[0].innerText.trim();
      }

      // Extract detailed description if available
      const descriptionEls = Array.from(block.querySelectorAll("div")).filter(
        (div) =>
          div.innerText &&
          div.innerText.length > 20 &&
          !div.innerText.includes("Points") &&
          !div.querySelector("button")
      );

      // Sort by length to get the most detailed description
      descriptionEls.sort((a, b) => b.innerText.length - a.innerText.length);

      const description =
        descriptionEls.length > 0 ? descriptionEls[0].innerText.trim() : "";

      // Get all rating options
      const ratingButtons = Array.from(
        block.querySelectorAll('[data-testid^="rubric-rating-button-"]')
      );
      const ratings = [];

      ratingButtons.forEach((btn) => {
        const container = btn.closest('[data-testid^="rating-button-"]');
        if (!container) {
          return;
        }

        const ariaLabel = container.getAttribute("aria-label") || "";
        const pointsMatch = ariaLabel.match(/\((\d+)(?:-\d+)? Points?\)/);
        const points = pointsMatch ? pointsMatch[1] : null;

        // Extract rating description
        const descriptionText = ariaLabel.split("Points)")[1]?.trim() || "";

        // Determine if this rating is selected
        const isSelected =
          btn.getAttribute("data-testid") === "rubric-rating-button-selected";

        if (points) {
          ratings.push({
            points: parseInt(points, 10),
            description: descriptionText,
            isSelected,
          });
        }
      });

      // Sort ratings by points (descending)
      ratings.sort((a, b) => b.points - a.points);

      // Extract max points
      const maxPoints = ratings.length > 0 ? ratings[0].points : 0;

      // Find currently selected rating
      const selectedRating = ratings.find((r) => r.isSelected) || null;

      // Determine if this criterion has been graded
      const isGraded = selectedRating !== null;

      // Sometimes question information is stored in HTML attributes
      const dataAttributes = {};
      const allElements = block.querySelectorAll("*");
      allElements.forEach((el) => {
        for (const attr of el.attributes) {
          if (attr.name.startsWith("data-") && attr.value.length > 10) {
            dataAttributes[attr.name] = attr.value;
          }
        }
      });

      // Title might be found in specific attributes
      Object.entries(dataAttributes).forEach(([key, value]) => {
        if ((key.includes("title") || key.includes("description")) && !value.includes("Instructor Points out of")) {
          questionContent = value;
        }
      });

      // Combine the data to find the most descriptive question content
      let questionText = questionHeading || questionContent || titleText;
      if (
        questionText.includes("Instructor Points out of") &&
        contentDivs.length > 0
      ) {
        // If we still have generic text, use the first non-generic content div
        questionText = contentDivs[0].innerText.trim();
      }

      // Final fallback: grab the first line of the description if it doesn't look like a generic label
      if (
        (questionText.includes("Instructor Points out of") ||
          questionText.length < 5) &&
        description
      ) {
        const firstLine = description.split("\n")[0];
        if (
          firstLine &&
          firstLine.length > 10 &&
          !firstLine.includes("Instructor Points out of")
        ) {
          questionText = firstLine;
        }
      }

      // Try to determine which section this block belongs to
      let sectionName = '';
      
      // Check if there's an explicit section assignment in Canvas data
      if (canvasRubricData && criterionId) {
        const criterion = canvasRubricData.rubric?.criteria?.[criterionId];
        if (criterion && criterion.criterion_group) {
          const groupInfo = canvasRubricData.rubric.criteria_groups?.[criterion.criterion_group];
          if (groupInfo) {
            sectionName = groupInfo.name;
          }
        }
      }
      
      // Enhanced DOM-based section extraction with multiple fallback strategies
      if (!sectionName && sectionHeadings.length > 0) {
        // Try to find nearest section by examining all DOM elements between the section heading and the block
        for (let i = sectionHeadings.length - 1; i >= 0; i--) {
          const heading = sectionHeadings[i];
          if (!heading.element) {
            continue;
          }
          
          // Check if this heading is a predecessor in DOM
          const position = block.compareDocumentPosition(heading.element);
          if (position & Node.DOCUMENT_POSITION_PRECEDING) {
            // Verify this is the most immediate predecessor by checking for intervening headings
            let isClosestPredecessor = true;
            for (let j = i + 1; j < sectionHeadings.length; j++) {
              if (sectionHeadings[j].element && 
                  heading.element.compareDocumentPosition(sectionHeadings[j].element) & Node.DOCUMENT_POSITION_FOLLOWING) {
                isClosestPredecessor = false;
                break;
              }
            }
            
            if (isClosestPredecessor) {
              sectionName = heading.text;
              break;
            }
          }
        }
      }
      
      // If still no section, try to infer from common parent elements
      if (!sectionName) {
        // Look for parent elements with classes that might indicate section grouping
        let currentNode = block.parentElement;
        const maxDepth = 5; // Limit how far up we look to avoid performance issues
        let depth = 0;
        
        while (currentNode && depth < maxDepth) {
          // Look for common section container classes
          if (currentNode.classList && 
              (currentNode.classList.contains('section') || 
               currentNode.classList.contains('criterion_group') || 
               currentNode.classList.contains('rubric-section'))) {
            
            // Try to find a heading within this container
            const sectionTitle = currentNode.querySelector('h2, h3, h4, .section-title, .group-title');
            if (sectionTitle && sectionTitle.textContent.trim()) {
              sectionName = sectionTitle.textContent.trim();
              break;
            }
          }
          
          currentNode = currentNode.parentElement;
          depth++;
        }
      }
      
      // If we still don't have a section name, try to extract one from the title
      if (!sectionName) {
        // Look for patterns like "Section Name - Question X" or "Section: Question"
        const sectionMatch = titleText.match(/^([^:-]+)[-:]\s*(.+)$/);
        if (sectionMatch && sectionMatch[1] && sectionMatch[1].length > 3) {
          sectionName = sectionMatch[1].trim();
        }
        
        // Additional pattern matching for question numbers which often indicate sections
        if (!sectionName) {
          const questionNumMatch = titleText.match(/^(Question|Q)\s*(\d+)/i);
          if (questionNumMatch && questionNumMatch[2]) {
            sectionName = `Question ${questionNumMatch[2]}`;
          }
        }
      }

      rubricData.push({
        index,
        title: titleText,
        description,
        questionHeading,
        questionText,
        maxPoints,
        ratings,
        selectedRating,
        isGraded,
        element: block,
        section: sectionName || null
      });
    } catch (err) {
      log(`Error extracting data for block ${index}:`, err);
    }
  });

  window.rubricData = rubricData;
  log(`Extracted data for ${rubricData.length} rubric criteria`);

  return rubricData;
};

/**
 * Grades a rubric item by clicking the rating button
 * @param {Element} ratingButton - Rating button element
 * @returns {boolean} Success or failure
 */
export const gradeRubricItem = (ratingButton) => {
  if (ratingButton) {
    ratingButton.click();
    return true;
  }
  return false;
}; 
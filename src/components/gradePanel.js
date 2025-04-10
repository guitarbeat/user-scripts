import log from '../utils/logger';
import { findCanvasButtonForRating, gradeRubricItem } from '../core/rubricData';

/**
 * Creates a grading panel for the selected rubric blocks
 * @param {Array} blocks - Array of rubric blocks to display in the panel
 */
export const createGradePanel = (blocks) => {
  const existingPanel = document.querySelector("#rubric-grade-panel");
  if (existingPanel) {
    existingPanel.remove();
  }

  if (!blocks || blocks.length === 0) {
    return;
  }

  const panel = document.createElement("div");
  panel.id = "rubric-grade-panel";
  
  // Calculate dynamic initial position
  // Try to get last saved position from localStorage
  let initialTop = "20px";
  let initialPosition = { right: "20px" }; // Default to right positioning
  
  try {
    const savedPosition = localStorage.getItem('gradePanelPosition');
    if (savedPosition) {
      const position = JSON.parse(savedPosition);
      // Make sure the panel is still visible in the viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (position.left) {
        // Panel was positioned by left
        const left = parseInt(position.left);
        if (left >= 0 && left < viewportWidth - 100) {
          initialPosition = { left: position.left };
        }
      } else if (position.right) {
        // Panel was positioned by right
        const right = parseInt(position.right);
        if (right >= 0 && right < viewportWidth - 100) {
          initialPosition = { right: position.right };
        }
      }
      
      // Set top position if valid
      if (position.top) {
        const top = parseInt(position.top);
        if (top >= 0 && top < viewportHeight - 100) {
          initialTop = position.top;
        }
      }
    }
  } catch (error) {
    // If there's an error, use default position
    log("⚠️ Error retrieving saved position:", error);
  }
  
  // Adjust position to avoid overlap with file browser panel if it exists
  const fileBrowserPanel = document.querySelector("#file-browser-panel");
  if (fileBrowserPanel) {
    const fileBrowserRect = fileBrowserPanel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // If file browser is on the left side, place grade panel on the right by default
    if (fileBrowserRect.left < viewportWidth / 2) {
      initialPosition = { right: "20px" };
    } else {
      // If file browser is on the right side, place grade panel on the left
      initialPosition = { left: "20px" };
    }
  }
  
  Object.assign(panel.style, {
    position: "fixed",
    top: initialTop,
    ...initialPosition,
    zIndex: 99_998,
    background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
    border: "none",
    padding: "10px 15px", // Increased horizontal padding
    borderRadius: "10px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
    fontSize: "13px",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    width: "450px", // Further increased for better text display
    maxHeight: "80vh",
    overflowY: "auto",
    transition: "all 0.3s ease",
    backdropFilter: "blur(5px)",
    scrollbarWidth: "thin",
    scrollbarColor: "#d1d1d1 transparent",
  });

  // Add custom scrollbar styling
  panel.innerHTML = `<style>
          #rubric-grade-panel::-webkit-scrollbar {
              width: 6px;
          }
          #rubric-grade-panel::-webkit-scrollbar-track {
              background: transparent;
          }
          #rubric-grade-panel::-webkit-scrollbar-thumb {
              background-color: #d1d1d1;
              border-radius: 6px;
          }
          .criterion-description {
              font-size: 12px;
              color: #444;
              margin-bottom: 12px;
              padding: 10px;
              background: rgba(240,240,240,0.5);
              border-radius: 4px;
              border-left: 3px solid #ccc;
              white-space: normal;
              word-wrap: break-word;
              overflow-wrap: break-word;
              line-height: 1.5;
              height: auto;
              max-height: none;
              overflow: visible;
          }
          .rating-description {
              font-size: 11px;
              color: #444;
              margin-top: 4px;
              font-style: italic;
              padding-left: 4px;
              border-left: 2px solid #e0e0e0;
          }
          .rating-tooltip {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: white;
              border: 1px solid #ddd;
              padding: 8px;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              z-index: 10;
              display: none;
              font-size: 11px;
              max-width: 300px;
              white-space: normal;
              word-wrap: break-word;
              overflow-wrap: break-word;
              line-height: 1.4;
          }
          .rating-btn:hover .rating-tooltip {
              display: block;
          }
      </style>`;

  // Get rubric data for the displayed blocks
  const rubricDataForBlocks = [];
  if (window.rubricData) {
    window.rubricData.forEach((data) => {
      if (blocks.includes(data.element)) {
        rubricDataForBlocks.push(data);
      }
    });
  }

  // Count graded items
  const gradedItems = blocks.filter((block) =>
    block.querySelector('[data-testid="rubric-rating-button-selected"]')
  ).length;

  // Calculate total points for displayed blocks
  let totalPossiblePoints = 0;
  let currentPoints = 0;

  rubricDataForBlocks.forEach((data) => {
    totalPossiblePoints += data.maxPoints;
    if (data.selectedRating) {
      currentPoints += data.selectedRating.points;
    }
  });

  const header = document.createElement("div");
  header.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid #e0e0e0;padding-bottom:8px">
          <div style="display:flex;flex-direction:column;">
              <strong style="font-size:15px;">🔰 Quick Grading</strong>
              <span style="color:#666;font-size:11px;margin-top:2px">${gradedItems}/${
    blocks.length
  } criteria graded</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end">
              <span style="color:#0374B5;font-weight:bold;font-size:14px">${currentPoints}/${totalPossiblePoints} pts</span>
              <span style="color:#666;font-size:11px;margin-top:2px">${
                Math.round((currentPoints / totalPossiblePoints) * 100) || 0
              }%</span>
          </div>
      </div>`;
  panel.appendChild(header);

  // Create grading sections for each rubric block
  rubricDataForBlocks.forEach((data, index) => {
    // Get the rating buttons
    if (!data.ratings || data.ratings.length === 0) {
      return;
    }

    // Create criterion section with status indicator
    const section = document.createElement("div");
    Object.assign(section.style, {
      marginBottom: "14px",
      padding: "12px",
      background: data.isGraded ? "#f0f7ff" : "#f8f8f8",
      borderRadius: "6px",
      border: data.isGraded ? "1px solid #c7e0ff" : "1px solid #e0e0e0",
      position: "relative",
    });

    // Add status bar at top if item is graded
    if (data.isGraded) {
      const statusBar = document.createElement("div");
      Object.assign(statusBar.style, {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        height: "3px",
        background: "#0374B5",
      });
      section.appendChild(statusBar);
    }

    // Extract the question number if available
    const questionMatch = data.title.match(/Question\s+(\d+[a-z]?)/i);
    const questionNum = questionMatch ? questionMatch[0] : "";

    // Try to extract the actual question text
    let questionContent =
      data.questionText || data.questionHeading || data.title;

    // If the title already contains the full question text, use that
    if (data.title.includes(":")) {
      const titleParts = data.title.split(":");
      if (titleParts.length > 1 && titleParts[1].trim().length > 10) {
        questionContent = titleParts[1].trim();
      }
    }

    // Check if we have a section title like "1. Code Modification and Functionality (10 Points)"
    const sectionTitleMatch = data.element?.innerText.match(
      /(\d+\.\s*[A-Za-z][\w\s,]+\([0-9]+\s*Points?\))/
    );
    if (
      sectionTitleMatch &&
      !questionContent.includes(sectionTitleMatch[1])
    ) {
      questionContent = sectionTitleMatch[1];
    }

    // Skip displaying the generic "Instructor Points out of X" as the question
    if (questionContent.includes("Instructor Points out of")) {
      // Try to find a better title from the full description
      if (data.description) {
        const firstLine = data.description.split("\n")[0];
        if (
          firstLine &&
          firstLine.length > 10 &&
          !firstLine.includes("Instructor Points out of")
        ) {
          questionContent = firstLine;
        }
      }

      // Last resort - try to get the actual question from the DOM structure again
      if (questionContent.includes("Instructor Points out of")) {
        const allTextElements = Array.from(data.element.querySelectorAll("*"))
          .filter(
            (el) =>
              el.textContent &&
              el.textContent.length > 15 &&
              el.textContent.length < 150 &&
              !el.textContent.includes("Instructor Points out of") &&
              !el.textContent.includes("pts") &&
              !el.querySelector("button")
          )
          .sort((a, b) => a.textContent.length - b.textContent.length); // Shorter texts first

        if (allTextElements.length > 0) {
          questionContent = allTextElements[0].textContent.trim();
        }
      }
    }

    // Add a clear header for the question with a more prominent design
    const fullQuestionHeader = document.createElement("div");
    Object.assign(fullQuestionHeader.style, {
      marginBottom: "8px",
      fontSize: "14px",
      fontWeight: "bold",
      color: "#333",
    });

    fullQuestionHeader.innerHTML = `
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
                  ${
                    questionNum
                      ? `<span style="color:#0374B5;font-size:15px">${questionNum}</span>`
                      : ""
                  }
                  <span>Question:</span>
              </div>
          `;
    section.appendChild(fullQuestionHeader);

    // Create a more prominent question content box with the actual section title
    const questionBox = document.createElement("div");
    Object.assign(questionBox.style, {
      marginBottom: "15px",
      padding: "10px 12px",
      background: "#f0f7ff",
      borderRadius: "6px",
      border: "1px solid #d0e3ff",
      fontSize: "13px",
      lineHeight: "1.5",
      color: "#333",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    });

    questionBox.innerHTML = questionContent;
    section.appendChild(questionBox);

    // Display criterion information in a more subtle way
    const criterionInfo = document.createElement("div");
    Object.assign(criterionInfo.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
      paddingBottom: "8px",
      borderBottom: "1px dotted #ddd",
    });

    criterionInfo.innerHTML = `
              <span style="font-size:12px;color:#666">Criterion: ${
                data.title
              }</span>
              ${
                data.isGraded
                  ? `<span style="color:#0374B5;font-weight:bold;font-size:12px">Currently: ${data.selectedRating.points}/${data.maxPoints}pts</span>`
                  : `<span style="color:#999;font-style:italic;font-size:11px">Not graded (${data.maxPoints}pts max)</span>`
              }
          `;
    section.appendChild(criterionInfo);

    // Add criterion description if available - make it more prominent
    if (data.description) {
      const descriptionEl = document.createElement("div");
      descriptionEl.className = "criterion-description";
      descriptionEl.innerHTML = data.description
        .replace(/\n/g, "<br>") // Replace newlines with <br> tags
        .replace(/\s{2,}/g, " &nbsp;"); // Preserve multiple spaces

      section.appendChild(descriptionEl);
    }

    // Create rating buttons container
    const ratingContainer = document.createElement("div");
    Object.assign(ratingContainer.style, {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: "4px",
    });

    // Create a button for each rating level
    data.ratings.forEach((rating) => {
      const isSelected =
        data.selectedRating && data.selectedRating.points === rating.points;

      const ratingBtn = document.createElement("div");
      ratingBtn.className = "rating-btn";

      // Apply different styling for selected rating
      Object.assign(ratingBtn.style, {
        flex: "1 0 45%", // Allow 2 buttons per row for more space
        padding: "8px 0",
        border: isSelected ? "none" : "1px solid #ccc",
        borderRadius: "4px",
        background: isSelected ? "#0374B5" : "#ffffff",
        color: isSelected ? "white" : "#333",
        cursor: "pointer",
        fontWeight: isSelected ? "bold" : "normal",
        boxShadow: isSelected ? "0 2px 4px rgba(3, 116, 181, 0.3)" : "none",
        fontSize: "12px",
        position: "relative",
        marginBottom: "4px",
        textAlign: "center",
      });

      // Create the content
      ratingBtn.innerHTML = `
                  <div style="display:flex;flex-direction:column;align-items:center">
                      <span style="font-size:13px">${rating.points}pts</span>
                      ${
                        isSelected
                          ? '<span style="font-size:10px;margin-top:2px">Current</span>'
                          : ""
                      }
                      ${
                        rating.description
                          ? `<div class="rating-tooltip">${rating.description}</div>`
                          : ""
                      }
                  </div>
              `;

      // Add tooltip with full description on hover
      if (rating.description) {
        ratingBtn.title = rating.description;
      }

      ratingBtn.addEventListener("mouseover", () => {
        if (!isSelected) {
          ratingBtn.style.background = "#f0f4f8";
        }
      });

      ratingBtn.addEventListener("mouseout", () => {
        if (!isSelected) {
          ratingBtn.style.background = "#ffffff";
        }
      });

      ratingBtn.addEventListener("click", () => {
        // Find the actual Canvas rating button for this rating
        const actualButton = findCanvasButtonForRating(
          data.element,
          rating.points
        );

        if (isSelected && !confirm(
          `This criterion is already graded with ${rating.points} points. Do you want to reconfirm this grade?`
        )) {
          return;
        }

        // Click the actual rating button in the Canvas UI
        if (actualButton) {
          gradeRubricItem(actualButton);
        } else {
          log("❌ Could not find Canvas button for rating:", rating.points);
        }

        // Update our UI
        setTimeout(() => {
          // Wait for event handler to trigger refresh
        }, 500);
      });

      ratingContainer.appendChild(ratingBtn);

      // Optionally add a small description snippet under each rating button
      if (!rating.description || rating.description.length === 0) {
        return;
      }
      const shortDesc =
      rating.description.length > 80
        ? `${rating.description.substring(0, 77)}...`
        : rating.description;

      const descriptionSnippet = document.createElement("div");
      descriptionSnippet.className = "rating-description";
      descriptionSnippet.textContent = shortDesc;
      descriptionSnippet.style.display = isSelected ? "" : "none";
      descriptionSnippet.style.color = isSelected ? "#e0f0ff" : "#666";
      descriptionSnippet.style.borderLeftColor = isSelected
      ? "#80b0e0"
      : "#e0e0e0";
      descriptionSnippet.style.background = isSelected
      ? "rgba(0,50,100,0.2)"
      : "transparent";

      if (isSelected) {
        ratingBtn.appendChild(descriptionSnippet);
      }
    });

    section.appendChild(ratingContainer);

    // Add detailed description of current selection if available
    if (
      data.isGraded &&
      data.selectedRating &&
      data.selectedRating.description
    ) {
      const descriptionBox = document.createElement("div");
      Object.assign(descriptionBox.style, {
        marginTop: "8px",
        padding: "10px",
        fontSize: "11px",
        background: "rgba(255,255,255,0.7)",
        borderRadius: "4px",
        border: "1px dashed #ccc",
        color: "#555",
        lineHeight: "1.4",
        whiteSpace: "normal",
        wordWrap: "break-word",
        overflowWrap: "break-word",
      });
      descriptionBox.textContent = data.selectedRating.description;
      section.appendChild(descriptionBox);
    }

    panel.appendChild(section);
  });

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  Object.assign(closeBtn.style, {
    width: "100%",
    padding: "6px",
    marginTop: "10px",
    background: "#f1f1f1",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#333",
  });

  closeBtn.addEventListener("mouseover", () => {
    closeBtn.style.background = "#e0e0e0";
  });

  closeBtn.addEventListener("mouseout", () => {
    closeBtn.style.background = "#f1f1f1";
  });

  closeBtn.addEventListener("click", () => {
    panel.remove();
  });

  panel.appendChild(closeBtn);
  document.body.appendChild(panel);

  // Make panel draggable
  let isDragging = false;
  let offsetX;
  let offsetY;

  header.style.cursor = "move";
  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
    
    // Bring panel to front when dragging starts
    panel.style.zIndex = "99999";
    
    // Check if file browser panel exists and set its z-index lower
    const fileBrowserPanel = document.querySelector("#file-browser-panel");
    if (fileBrowserPanel) {
      fileBrowserPanel.style.zIndex = "99998";
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) {
      return;
    }
    
    // Calculate new position
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    
    // Ensure panel stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    
    // Keep at least 20px of panel visible at all times
    const minVisiblePortion = 20;
    const boundedLeft = Math.max(0, Math.min(newLeft, viewportWidth - minVisiblePortion - panelWidth));
    const boundedTop = Math.max(0, Math.min(newTop, viewportHeight - minVisiblePortion));
    
    // Switch to left positioning when dragging
    panel.style.left = `${boundedLeft}px`;
    panel.style.top = `${boundedTop}px`;
    panel.style.right = "auto";
    
    // Save position to localStorage
    try {
      localStorage.setItem('gradePanelPosition', JSON.stringify({
        left: `${boundedLeft}px`,
        top: `${boundedTop}px`
      }));
    } catch (error) {
      // Silent fail if localStorage isn't available
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}; 
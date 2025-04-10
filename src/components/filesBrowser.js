import log from '../utils/logger';

/**
 * Creates a browser for viewing submitted files
 */
export const createFilesBrowserUI = () => {
  // First check if there's an existing panel
  const existingPanel = document.querySelector("#file-browser-panel");
  if (existingPanel) {
    existingPanel.remove();
  }

  // Extract files information
  const submissionFilesContainer = document.querySelector(
    "div#submission_files_container"
  );
  if (!submissionFilesContainer) {
    log("❌ No submission files container found");
    return;
  }

  const filesList = submissionFilesContainer.querySelector(
    "div#submission_files_list"
  );
  const fileItems = filesList
    ? Array.from(filesList.querySelectorAll("a"))
    : [];

  // No files to display
  if (fileItems.length === 0) {
    log("ℹ️ No submission files found for this student");
    return;
  }

  // Get current student name
  const studentSelect = document.querySelector("#students_selectmenu");
  const selectedOption = studentSelect?.querySelector("option:checked");
  const studentName = selectedOption?.text || "Student";

  // Create the panel
  const panel = document.createElement("div");
  panel.id = "file-browser-panel";
  
  // Calculate dynamic initial position
  // Try to get last saved position from localStorage
  let initialLeft = "20px";
  let initialTop = "20px";
  
  try {
    const savedPosition = localStorage.getItem('fileBrowserPanelPosition');
    if (savedPosition) {
      const position = JSON.parse(savedPosition);
      // Make sure the panel is still visible in the viewport
      if (position && position.left && position.top) {
        // Ensure panel is within visible area
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const left = parseInt(position.left);
        const top = parseInt(position.top);
        
        // Use saved position only if it's within viewport
        if (left < viewportWidth - 100 && left >= 0 && 
            top < viewportHeight - 100 && top >= 0) {
          initialLeft = position.left;
          initialTop = position.top;
        }
      }
    }
  } catch (error) {
    // If there's an error, use default position
    log("⚠️ Error retrieving saved position:", error);
  }
  
  Object.assign(panel.style, {
    position: "fixed",
    top: initialTop,
    left: initialLeft,
    zIndex: 99_997,
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
    fontSize: "13px",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minWidth: "220px",
    maxWidth: "260px",
    maxHeight: "50vh",
    overflowY: "auto",
    transition: "all 0.3s ease",
    backdropFilter: "blur(5px)",
    scrollbarWidth: "thin",
    scrollbarColor: "#d1d1d1 transparent",
  });

  // Add custom scrollbar styling
  const style = document.createElement("style");
  style.textContent = `
          #file-browser-panel::-webkit-scrollbar {
              width: 6px;
          }
          #file-browser-panel::-webkit-scrollbar-track {
              background: transparent;
          }
          #file-browser-panel::-webkit-scrollbar-thumb {
              background-color: #d1d1d1;
              border-radius: 6px;
          }
      `;
  document.head.appendChild(style);

  // Create header with student name
  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    flexDirection: "column",
    marginBottom: "10px",
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: "10px",
  });

  const titleRow = document.createElement("div");
  Object.assign(titleRow.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  });

  const title = document.createElement("div");
  title.innerHTML =
    '<span style="font-weight:bold;font-size:15px;">📄 Submitted Files</span>';
  titleRow.appendChild(title);

  const count = document.createElement("div");
  count.innerHTML = `<span style="color:#0374B5;font-weight:bold;font-size:15px">${fileItems.length}</span>`;
  titleRow.appendChild(count);

  header.appendChild(titleRow);

  const studentInfo = document.createElement("div");
  Object.assign(studentInfo.style, {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#666",
    marginTop: "6px",
  });

  const nameDiv = document.createElement("div");
  nameDiv.innerHTML = `<span style="color:#333">👤 ${studentName}</span>`;
  studentInfo.appendChild(nameDiv);

  header.appendChild(studentInfo);

  panel.appendChild(header);

  // Create files list container
  const filesContainer = document.createElement("div");
  Object.assign(filesContainer.style, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });

  // Add file items
  fileItems.forEach((item, index) => {
    const fileName = item.textContent.trim();
    const fileUrl = item.href;

    // Skip the "Delete this file" links
    if (fileName.includes("Delete this file")) {
      return;
    }

    // Skip ALL "Download this file" links
    if (fileName === "Download this file") {
      return;
    }

    const fileItem = document.createElement("div");
    Object.assign(fileItem.style, {
      padding: "8px 10px",
      borderRadius: "6px",
      border: "1px solid #e9e9e9",
      background: "#ffffff",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      cursor: "pointer",
      transition: "all 0.2s ease",
    });

    // Determine file type icon based on filename extension
    // Check for compound extensions first, then fallback to the simple extension
    let ext = "";
    
    // Handle special compound extensions
    if (fileName.endsWith(".tar.gz")) {
      ext = "tar.gz";
    } else if (fileName.endsWith(".tar.bz2")) {
      ext = "tar.bz2";
    } else {
      // Fallback to regular extension extraction
      ext = fileName.split(".").pop()?.toLowerCase() || "";
    }
    
    let fileIcon = "📄"; // Default document icon

    if (["pdf"].includes(ext)) {
      fileIcon = "📕";
    } else if (["doc", "docx"].includes(ext)) {
      fileIcon = "📘";
    } else if (["xls", "xlsx", "csv"].includes(ext)) {
      fileIcon = "📗";
    } else if (["ppt", "pptx"].includes(ext)) {
      fileIcon = "📙";
    } else if (["zip", "rar", "7z", "tar", "gz", "tar.gz", "tar.bz2"].includes(ext)) {
      fileIcon = "🗜️";
    } else if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) {
      fileIcon = "🖼️";
    } else if (["mp3", "wav", "ogg", "flac"].includes(ext)) {
      fileIcon = "🎵";
    } else if (["mp4", "avi", "mov", "wmv", "flv"].includes(ext)) {
      fileIcon = "🎬";
    } else if (["html", "htm", "css", "js"].includes(ext)) {
      fileIcon = "🌐";
    } else if (
      [
        "py",
        "java",
        "c",
        "cpp",
        "cs",
        "php",
        "rb",
        "go",
        "rust",
        "js",
        "ts",
      ].includes(ext)
    ) {
      fileIcon = "👨‍💻";
    }

    // Display truncated filename if too long
    const shortName =
      fileName.length > 24 ? `${fileName.substring(0, 21)}...` : fileName;

    fileItem.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center">
                  <div style="display:flex;align-items:center;gap:6px">
                      <span style="font-size:16px">${fileIcon}</span>
                      <span style="font-size:12px;color:#333" title="${fileName}">${shortName}</span>
                  </div>
                  <div>
                      <span style="color:#0374B5;font-size:13px">↗️</span>
                  </div>
              </div>
          `;

    fileItem.addEventListener("mouseover", () => {
      fileItem.style.background = "#f0f7ff";
      fileItem.style.borderColor = "#d0e3ff";
    });

    fileItem.addEventListener("mouseout", () => {
      fileItem.style.background = "#ffffff";
      fileItem.style.borderColor = "#e9e9e9";
    });

    fileItem.addEventListener("click", () => {
      // Open file in a new tab
      window.open(fileUrl, "_blank");
    });

    filesContainer.appendChild(fileItem);
  });

  panel.appendChild(filesContainer);

  // Add toggle visibility button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "Hide Files";
  Object.assign(toggleBtn.style, {
    width: "100%",
    padding: "6px",
    marginTop: "10px",
    background: "#f1f1f1",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#333",
    fontWeight: "bold",
  });

  toggleBtn.addEventListener("mouseover", () => {
    toggleBtn.style.background = "#e0e0e0";
  });

  toggleBtn.addEventListener("mouseout", () => {
    toggleBtn.style.background = "#f1f1f1";
  });

  let filesVisible = true;
  toggleBtn.addEventListener("click", () => {
    if (filesVisible) {
      filesContainer.style.display = "none";
      toggleBtn.textContent = "Show Files";
    } else {
      filesContainer.style.display = "flex";
      toggleBtn.textContent = "Hide Files";
    }
    filesVisible = !filesVisible;
  });

  panel.appendChild(toggleBtn);
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
    
    // Check if grade panel exists and set its z-index lower
    const gradePanel = document.querySelector("#rubric-grade-panel");
    if (gradePanel) {
      gradePanel.style.zIndex = "99998";
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
    const boundedLeft = Math.max(0, Math.min(newLeft, viewportWidth - minVisiblePortion));
    const boundedTop = Math.max(0, Math.min(newTop, viewportHeight - minVisiblePortion));
    
    panel.style.left = `${boundedLeft}px`;
    panel.style.top = `${boundedTop}px`;
    
    // Save position to localStorage
    try {
      localStorage.setItem('fileBrowserPanelPosition', JSON.stringify({
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
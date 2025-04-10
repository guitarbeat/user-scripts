/**
 * Helper to categorize file types
 */
export const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv'];
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
  const codeExts = ['py', 'js', 'html', 'css', 'c', 'cpp', 'h', 'java', 'ino', 'arduino'];
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];

  if (videoExts.includes(ext)) {
    return 'video';
  }
  if (imageExts.includes(ext)) {
    return 'image';
  }
  if (codeExts.includes(ext)) {
    return 'code';
  }
  if (docExts.includes(ext)) {
    return 'document';
  }
  return 'other';
};

/**
 * Get student's submitted files
 */
export const getSubmittedFiles = () => {
  const filesContainer = document.querySelector('#submission_files_list');
  if (!filesContainer) {
    return [];
  }

  return Array.from(filesContainer.querySelectorAll('.submission-file')).map(file => {
    const linkElement = file.querySelector('a.display_name');
    const downloadLink = file.querySelector('a.submission-file-download');

    return {
      filename: linkElement?.textContent?.trim() || "Unknown file",
      url: linkElement?.href || "",
      downloadUrl: downloadLink?.href || "",
      extension: (linkElement?.textContent?.split('.').pop() || "").toLowerCase(),
      fileType: getFileType(linkElement?.textContent || "")
    };
  });
};

/**
 * Check for specific file submissions
 */
export const checkRequiredFiles = (files) => {
  if (!files || files.length === 0) {
    return {};
  }

  return {
    hasVideo: files.some(file => file.fileType === 'video'),
    hasCode: files.some(file => file.fileType === 'code'),
    hasArduinoCode: files.some(file => file.extension === 'ino'),
    hasNISpecs: files.some(file => file.filename.toLowerCase().includes('ni') &&
                           file.filename.toLowerCase().includes('spec')),
    hasQ5Video: files.some(f => f.filename.toLowerCase().includes('q5') && f.fileType === 'video'),
    hasPDF: files.some(file => file.extension === 'pdf'),
    filesByType: files.reduce((acc, file) => {
      if (!acc[file.fileType]) {
        acc[file.fileType] = [];
      }
      acc[file.fileType].push(file);
      return acc;
    }, {})
  };
}; 
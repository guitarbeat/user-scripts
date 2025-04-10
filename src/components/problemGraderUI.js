import log from '../utils/logger';
import { extractQuestionBlocks, getSelectedRatingForBlock, showRubricBlocks } from './problemGrader';
import { getSubmittedFiles, checkRequiredFiles } from '../utils/fileGraderUtils';
import { fetchAllStudentData, navigateToStudent } from '../utils/studentNavUtils';

/**
 * Function to create the problem grader button
 */
export const createProblemGraderButton = () => {
  const existingButton = document.querySelector('#problem-grader-button');
  if (existingButton) {
    existingButton.remove();
  }

  const button = document.createElement('button');
  button.id = 'problem-grader-button';
  button.textContent = '🧑‍🎓 Grade by Problem';
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '10px 15px',
    background: 'linear-gradient(90deg, #0374B5 0%, #0097e6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    zIndex: 99997,
    fontWeight: 'bold',
    fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  });

  button.addEventListener('click', () => {
    openProblemSelector();
  });

  document.body.appendChild(button);
};

/**
 * Function to open the problem selector panel with option for full comprehensive scan
 */
export const openProblemSelector = () => {
  const existingPanel = document.querySelector('#problem-selector-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  const questions = extractQuestionBlocks();
  if (questions.length === 0) {
    alert('No questions found in the rubric. Make sure the rubric is loaded.');
    return;
  }

  // Create the selector panel
  const panel = document.createElement('div');
  panel.id = 'problem-selector-panel';
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '70px',
    right: '20px',
    width: '320px',
    maxHeight: '70vh',
    overflowY: 'auto',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: 99996,
    padding: '15px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  });

  // Add header
  const header = document.createElement('div');
  header.innerHTML = '<h3 style="margin:0 0 15px 0;font-size:16px">🔍 Select a Problem to Grade</h3>';
  panel.appendChild(header);

  // Add "Scan All Questions" button at the top
  const scanAllBtn = document.createElement('button');
  scanAllBtn.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;gap:8px">
      <span style="font-size:16px">🔄</span>
      <span>Scan All Questions (Faster)</span>
    </div>
  `;
  Object.assign(scanAllBtn.style, {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    background: 'linear-gradient(90deg, #0374B5 0%, #0097e6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    textAlign: 'center'
  });

  scanAllBtn.addEventListener('click', () => {
    panel.remove();
    openComprehensiveView();
  });

  panel.appendChild(scanAllBtn);

  // Add question list
  const list = document.createElement('div');
  Object.assign(list.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  });

  questions.forEach(question => {
    const item = document.createElement('button');
    const shortTitle = question.criterionTitle.length > 40 ?
      question.criterionTitle.substring(0, 37) + '...' :
      question.criterionTitle;

    item.innerHTML = `
      <div style="display:flex;align-items:center;text-align:left;gap:8px">
        <div style="flex-shrink:0;font-weight:bold;color:#0374B5">${question.tag}</div>
        <div style="font-size:13px;color:#333">${shortTitle}</div>
        <div style="margin-left:auto;font-size:11px;color:#777">${question.blocks.length} criteria</div>
      </div>
    `;

    Object.assign(item.style, {
      padding: '10px',
      background: '#f5f8fa',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    });

    item.addEventListener('mouseover', () => {
      item.style.background = '#edf5ff';
      item.style.borderColor = '#c0d8ff';
    });

    item.addEventListener('mouseout', () => {
      item.style.background = '#f5f8fa';
      item.style.borderColor = '#e0e0e0';
    });

    item.addEventListener('click', () => {
      panel.remove();
      openStudentOverview(question.tag);
    });

    list.appendChild(item);
  });

  panel.appendChild(list);

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  Object.assign(closeButton.style, {
    width: '100%',
    padding: '8px',
    marginTop: '15px',
    background: '#f1f1f1',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  });

  closeButton.addEventListener('click', () => {
    panel.remove();
  });

  panel.appendChild(closeButton);
  document.body.appendChild(panel);
};

/**
 * Function to open the student overview for a specific question
 */
export const openStudentOverview = (questionTag) => {
  // Fetch data for all students for this question
  fetchAllStudentData(
    (studentData, allQuestions) => createStudentOverviewPanel(studentData, allQuestions.find(q => q.tag === questionTag)),
    extractQuestionBlocks,
    getSelectedRatingForBlock,
    getSubmittedFiles,
    checkRequiredFiles
  );
};

/**
 * Function to create the student overview panel
 */
export const createStudentOverviewPanel = (studentData, questionData) => {
  const existingPanel = document.querySelector('#student-overview-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement('div');
  panel.id = 'student-overview-panel';
  Object.assign(panel.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    maxWidth: '1200px',
    height: '80vh',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  });

  // Add panel header
  const header = document.createElement('div');
  Object.assign(header.style, {
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

  header.innerHTML = `
    <div>
      <h2 style="margin:0;font-size:18px">${questionData.tag}: ${questionData.criterionTitle}</h2>
      <div style="font-size:12px;color:#666;margin-top:4px">${studentData.length} students • ${questionData.blocks.length} criteria per student</div>
    </div>
    <button id="close-overview-panel" style="background:none;border:none;font-size:20px;cursor:pointer">×</button>
  `;

  panel.appendChild(header);

  // Add student list with grades
  const content = document.createElement('div');
  Object.assign(content.style, {
    flex: 1,
    overflowY: 'auto',
    padding: '15px 20px'
  });

  // Add filtering/sorting options
  const controls = document.createElement('div');
  Object.assign(controls.style, {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    gap: '10px'
  });

  const filterOptions = document.createElement('div');
  Object.assign(filterOptions.style, {
    display: 'flex',
    gap: '10px'
  });

  // Filter buttons: All, Graded, Ungraded
  const createFilterButton = (label, filter) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: '6px 12px',
      background: '#f1f1f1',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });

    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterOptions.querySelectorAll('button').forEach(b => {
        b.style.background = '#f1f1f1';
        b.style.fontWeight = 'normal';
      });

      // Add active class to this button
      btn.style.background = '#e0e0e0';
      btn.style.fontWeight = 'bold';

      // Apply filter
      const studentItems = Array.from(studentList.querySelectorAll('.student-item'));
      studentItems.forEach(item => {
        const studentId = item.getAttribute('data-student-id');
        const student = studentData.find(s => s.id === studentId);

        if (!student) {
          return;
        }

        const questionInfo = student.questionData[questionData.tag];
        if (!questionInfo) {
          return;
        }

        const gradingData = questionInfo.gradingData || [];
        const isGraded = gradingData.some(d => d !== null);

        if (filter === 'all' ||
          (filter === 'graded' && isGraded) ||
          (filter === 'ungraded' && !isGraded)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });

    return btn;
  };

  const allButton = createFilterButton('All Students', 'all');
  allButton.style.background = '#e0e0e0';
  allButton.style.fontWeight = 'bold';

  const gradedButton = createFilterButton('Graded', 'graded');
  const ungradedButton = createFilterButton('Ungraded', 'ungraded');

  filterOptions.appendChild(allButton);
  filterOptions.appendChild(gradedButton);
  filterOptions.appendChild(ungradedButton);

  controls.appendChild(filterOptions);
  content.appendChild(controls);

  // Create student list
  const studentList = document.createElement('div');
  Object.assign(studentList.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  });

  // Prepare student data for the current question
  const preparedStudentData = studentData.map(student => {
    const questionInfo = student.questionData[questionData.tag];
    if (!questionInfo) {
      return null;
    }

    const gradingData = questionInfo.gradingData || [];
    const isGraded = gradingData.some(d => d !== null);
    const totalPoints = gradingData.reduce((sum, data) => sum + (data ? parseInt(data.points, 10) : 0), 0);
    const maxPossiblePoints = questionData.blocks.length * 5; // Assuming max 5 points per criterion

    return {
      ...student,
      gradingData,
      isGraded,
      totalPoints,
      maxPossiblePoints
    };
  }).filter(student => student !== null);

  // Count graded vs ungraded students
  const gradedCount = preparedStudentData.filter(s => s.isGraded).length;

  // Add progress bar at the top
  const progressContainer = document.createElement('div');
  Object.assign(progressContainer.style, {
    marginBottom: '15px'
  });

  progressContainer.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:12px">
      <span>Overall Progress</span>
      <span>${gradedCount}/${preparedStudentData.length} students graded (${Math.round(gradedCount/preparedStudentData.length*100)}%)</span>
    </div>
    <div style="height:6px;background:#eee;border-radius:3px;overflow:hidden">
      <div style="height:100%;background:#0374B5;width:${Math.round(gradedCount/preparedStudentData.length*100)}%"></div>
    </div>
  `;

  content.appendChild(progressContainer);

  // Add each student to the list
  preparedStudentData.forEach(student => {
    const studentItem = document.createElement('div');
    studentItem.className = 'student-item';
    studentItem.setAttribute('data-student-id', student.id);

    Object.assign(studentItem.style, {
      padding: '12px 15px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      background: student.isCurrentStudent ? '#f5faff' : '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    });

    if (student.isCurrentStudent) {
      studentItem.style.borderColor = '#c0d8ff';
    }

    // Build file status indicators
    const fileStatusHTML = student.fileChecks ? `
      <div style="display:flex;gap:6px;font-size:11px;margin-top:3px">
        ${student.fileChecks.hasVideo ? '<span style="background:#e7f7e7;color:#0a6b0a;padding:1px 6px;border-radius:3px">Video ✓</span>' : ''}
        ${student.fileChecks.hasCode ? '<span style="background:#e7f7e7;color:#0a6b0a;padding:1px 6px;border-radius:3px">Code ✓</span>' : ''}
        ${student.fileChecks.hasNISpecs ? '<span style="background:#e7f7e7;color:#0a6b0a;padding:1px 6px;border-radius:3px">NI Spec ✓</span>' : ''}
        ${student.fileChecks.hasQ5Video ? '<span style="background:#e7f7e7;color:#0a6b0a;padding:1px 6px;border-radius:3px">Q5 Video ✓</span>' : ''}
        ${!student.fileChecks.hasVideo && questionData.tag.toLowerCase().includes('video') ? '<span style="background:#f7e7e7;color:#6b0a0a;padding:1px 6px;border-radius:3px">Missing Video ❌</span>' : ''}
        ${!student.fileChecks.hasCode && questionData.tag.toLowerCase().includes('code') ? '<span style="background:#f7e7e7;color:#6b0a0a;padding:1px 6px;border-radius:3px">Missing Code ❌</span>' : ''}
      </div>
    ` : '';

    // Create student info section
    const studentInfo = document.createElement('div');
    studentInfo.innerHTML = `
      <div style="font-weight:bold;margin-bottom:3px;display:flex;align-items:center;gap:6px">
        ${student.name}
        ${student.isCurrentStudent ? '<span style="font-size:11px;color:#0374B5;background:#e7f3ff;padding:2px 6px;border-radius:4px">Current</span>' : ''}
      </div>
      <div style="font-size:12px;color:#666">
        ${student.isGraded ? `Graded: ${student.totalPoints}/${student.maxPossiblePoints} points` : 'Not graded yet'}
      </div>
      ${fileStatusHTML}
    `;

    // Create grade indicators
    const gradeIndicators = document.createElement('div');
    Object.assign(gradeIndicators.style, {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    });

    // Navigate button
    const navigateButton = document.createElement('button');
    navigateButton.innerHTML = '<span style="font-size:13px">📄 View</span>';
    Object.assign(navigateButton.style, {
      padding: '6px 12px',
      background: '#f1f1f1',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });

    navigateButton.addEventListener('click', () => {
      navigateToStudent(student.id);
    });

    gradeIndicators.appendChild(navigateButton);

    // Quick grade button (if not current student)
    if (!student.isCurrentStudent) {
      const gradeButton = document.createElement('button');
      gradeButton.innerHTML = '<span style="font-size:13px">✏️ Grade</span>';
      Object.assign(gradeButton.style, {
        padding: '6px 12px',
        background: '#0374B5',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      });

      gradeButton.addEventListener('click', () => {
        navigateToStudent(student.id).then(() => {
          // Wait for navigation and then open the quick grading panel
          setTimeout(() => {
            // Find the question blocks
            const questions = extractQuestionBlocks();
            const question = questions.find(q => q.tag === questionData.tag);

            if (question && question.blocks.length > 0) {
              // Show the blocks and open the grading panel
              showRubricBlocks(question.blocks);
            } else {
              alert(`Could not find ${questionData.tag} for this student.`);
            }
          }, 1000);
        });
      });

      gradeIndicators.appendChild(gradeButton);
    }

    studentItem.appendChild(studentInfo);
    studentItem.appendChild(gradeIndicators);
    studentList.appendChild(studentItem);
  });

  content.appendChild(studentList);
  panel.appendChild(content);

  // Add close event
  document.body.appendChild(panel);
  document.getElementById('close-overview-panel').addEventListener('click', () => {
    panel.remove();
  });
};

/**
 * Function to open the comprehensive view with all student data
 */
export const openComprehensiveView = () => {
  // Fetch all data for all students
  fetchAllStudentData(
    createComprehensivePanel,
    extractQuestionBlocks,
    getSelectedRatingForBlock,
    getSubmittedFiles,
    checkRequiredFiles
  );
};

/**
 * Function to create the comprehensive data panel
 */
export const createComprehensivePanel = (studentData, questionData) => {
  // Implementation similar to createStudentOverviewPanel but for all questions
  const existingPanel = document.querySelector('#comprehensive-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement('div');
  panel.id = 'comprehensive-panel';
  Object.assign(panel.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    maxWidth: '1200px',
    height: '80vh',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  });

  // Add panel header
  const header = document.createElement('div');
  Object.assign(header.style, {
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

  header.innerHTML = `
    <div>
      <h2 style="margin:0;font-size:18px">All Questions Overview</h2>
      <div style="font-size:12px;color:#666;margin-top:4px">${studentData.length} students • ${questionData.length} questions</div>
    </div>
    <button id="close-comprehensive-panel" style="background:none;border:none;font-size:20px;cursor:pointer">×</button>
  `;

  panel.appendChild(header);

  // Simple content for now - we'll add tabs for different questions
  const content = document.createElement('div');
  Object.assign(content.style, {
    flex: 1,
    overflowY: 'auto',
    padding: '15px 20px'
  });
  
  // Create tabs for each question
  const tabsContainer = document.createElement('div');
  Object.assign(tabsContainer.style, {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee'
  });
  
  // Add tabs for each question
  questionData.forEach((question, index) => {
    const tab = document.createElement('button');
    tab.textContent = question.tag;
    tab.dataset.index = index;
    
    Object.assign(tab.style, {
      padding: '8px 15px',
      background: index === 0 ? '#e0e0e0' : '#f1f1f1',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: index === 0 ? 'bold' : 'normal'
    });
    
    tab.addEventListener('click', () => {
      // Highlight this tab
      tabsContainer.querySelectorAll('button').forEach(b => {
        b.style.background = '#f1f1f1';
        b.style.fontWeight = 'normal';
      });
      tab.style.background = '#e0e0e0';
      tab.style.fontWeight = 'bold';
      
      // TODO: Show content for this question
    });
    
    tabsContainer.appendChild(tab);
  });
  
  content.appendChild(tabsContainer);
  content.innerHTML += `<p>Comprehensive view provides analysis of all ${questionData.length} questions across ${studentData.length} students.</p>`;
  
  panel.appendChild(content);

  // Add close event
  document.body.appendChild(panel);
  document.getElementById('close-comprehensive-panel').addEventListener('click', () => {
    panel.remove();
  });
}; 
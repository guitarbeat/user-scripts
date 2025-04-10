/**
 * Navigate to a specific student
 * @param {string} studentId - The ID of the student to navigate to
 * @returns {Promise<boolean>} - Whether the navigation was successful
 */
export const navigateToStudent = (studentId) => {
  return new Promise((resolve) => {
    // Find the student option and select it
    const studentSelect = document.querySelector('#students_selectmenu');
    if (!studentSelect) {
      resolve(false);
      return;
    }

    const option = studentSelect.querySelector(`option[value="${studentId}"]`);
    if (!option) {
      resolve(false);
      return;
    }

    // Set the option as selected
    option.selected = true;

    // Trigger change event
    const event = new Event('change', { bubbles: true });
    studentSelect.dispatchEvent(event);

    // Allow time for navigation with reduced delay
    setTimeout(() => resolve(true), 250);
  });
};

/**
 * Fetch all problem data for all students (comprehensive scan)
 */
export const fetchAllStudentData = async (callback, extractQuestionBlocks, getSelectedRatingForBlock, getSubmittedFiles, checkRequiredFiles) => {
  const students = Array.from(document.querySelector('#students_selectmenu').querySelectorAll('option')).map(option => ({
    id: option.value,
    name: option.textContent.trim(),
    selected: option.selected
  }));
  
  const currentStudentId = students.find(s => s.selected)?.id;
  const totalStudents = students.length;
  let processedStudents = 0;

  // Get all possible question tags/blocks
  const allQuestions = extractQuestionBlocks();
  const studentData = [];

  // Create a temporary status overlay
  const statusOverlay = document.createElement('div');
  Object.assign(statusOverlay.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 9999999,
    textAlign: 'center'
  });
  statusOverlay.innerHTML = `
    <div>Comprehensive scan of all student data...</div>
    <div style="margin-top:10px;font-weight:bold">0 / ${totalStudents}</div>
    <div style="margin-top:15px">
      <progress value="0" max="${totalStudents}" style="width:200px"></progress>
    </div>
  `;
  document.body.appendChild(statusOverlay);

  // Function to process one student at a time
  const processNextStudent = async (index) => {
    if (index >= students.length) {
      // We're done
      document.body.removeChild(statusOverlay);
      callback(studentData, allQuestions);
      return;
    }

    const student = students[index];
    const studentQuestionData = {};

    // Skip current student - we already have their data
    if (student.id === currentStudentId) {
      // Get data for current student for all questions
      allQuestions.forEach(question => {
        const blocks = question.blocks || [];
        const gradingData = blocks.map(block => {
          const rating = getSelectedRatingForBlock(block);
          return rating ? { points: rating.points, description: rating.description } : null;
        });

        studentQuestionData[question.tag] = {
          gradingData,
          criterionTitle: question.criterionTitle,
          blocks: blocks.length
        };
      });

      // Get current student's submitted files
      const files = getSubmittedFiles();
      const fileChecks = checkRequiredFiles(files);

      studentData.push({
        id: student.id,
        name: student.name,
        isCurrentStudent: true,
        questionData: studentQuestionData,
        files,
        fileChecks
      });

      processedStudents++;
      statusOverlay.querySelector('div:nth-child(2)').textContent = `${processedStudents} / ${totalStudents}`;
      statusOverlay.querySelector('progress').value = processedStudents;

      // Process next student
      setTimeout(() => processNextStudent(index + 1), 0);
      return;
    }

    // Navigate to student
    await navigateToStudent(student.id);

    // Short delay to let the UI update
    setTimeout(() => {
      // Get data for all questions for this student
      const currentQuestions = extractQuestionBlocks();

      currentQuestions.forEach(question => {
        const blocks = question.blocks || [];
        const gradingData = blocks.map(block => {
          const rating = getSelectedRatingForBlock(block);
          return rating ? { points: rating.points, description: rating.description } : null;
        });

        studentQuestionData[question.tag] = {
          gradingData,
          criterionTitle: question.criterionTitle,
          blocks: blocks.length
        };
      });

      // Get submitted files for this student
      const files = getSubmittedFiles();
      const fileChecks = checkRequiredFiles(files);

      studentData.push({
        id: student.id,
        name: student.name,
        isCurrentStudent: false,
        questionData: studentQuestionData,
        files,
        fileChecks
      });

      processedStudents++;
      statusOverlay.querySelector('div:nth-child(2)').textContent = `${processedStudents} / ${totalStudents}`;
      statusOverlay.querySelector('progress').value = processedStudents;

      // Process next student with reduced delay
      setTimeout(() => processNextStudent(index + 1), 50);
    }, 400);
  };

  // Start processing from the first student
  processNextStudent(0);

  // At the end, navigate back to the original student
  setTimeout(() => {
    navigateToStudent(currentStudentId);
  }, 500);
}; 
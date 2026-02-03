/**
 * Demo account data: 6 semesters, each with exactly 8 courses, 10 calendar events,
 * timetable slots, 10 notes, 8 grades (GPA), and 8+ files. Nothing blank.
 */

const day = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const now = () => new Date().toISOString()

const courseDetailProps = (schedule, contactHrs, dept, textbook, syllabus, lms) => ({
  Schedule: schedule,
  'Contact Hours': contactHrs,
  Department: dept,
  Textbook: textbook,
  'Syllabus Link': syllabus,
  'LMS Link': lms
})

// 48 courses: 8 per semester. s1=1-8, s2=9-16, s3=17-24, s4=25-32, s5=33-40, s6=41-48
const SEMESTER_COURSES = {
  s1: [
    { name: 'Data Structures & Algorithms', code: 'CS301', venue: 'ROOM-A101', faculty: 'Dr. Sarah Chen', credits: '4', progress: 78, color: '#3b82f6' },
    { name: 'Database Management Systems', code: 'CS302', venue: 'LAB-B205', faculty: 'Prof. Michael Ross', credits: '3', progress: 65, color: '#a855f7' },
    { name: 'Operating Systems', code: 'CS303', venue: 'ROOM-C301', faculty: 'Dr. Emily Wang', credits: '4', progress: 52, color: '#06b6d4' },
    { name: 'Computer Networks', code: 'CS304', venue: 'LAB-D102', faculty: 'Prof. James Miller', credits: '3', progress: 41, color: '#10b981' },
    { name: 'Linear Algebra', code: 'MA201', venue: 'ROOM-E201', faculty: 'Dr. Lisa Anderson', credits: '3', progress: 88, color: '#f59e0b' },
    { name: 'Machine Learning', code: 'CS305', venue: 'LAB-F301', faculty: 'Dr. David Park', credits: '4', progress: 35, color: '#ec4899' },
    { name: 'Web Development', code: 'CS306', venue: 'LAB-G102', faculty: 'Prof. Anna Martinez', credits: '3', progress: 92, color: '#f97316' },
    { name: 'Software Engineering', code: 'CS307', venue: 'ROOM-H201', faculty: 'Dr. Robert Kim', credits: '3', progress: 70, color: '#84cc16' }
  ],
  s2: [
    { name: 'Compiler Design', code: 'CS401', venue: 'ROOM-A102', faculty: 'Dr. Nina Patel', credits: '4', progress: 60, color: '#6366f1' },
    { name: 'Distributed Systems', code: 'CS402', venue: 'LAB-B210', faculty: 'Prof. Raj Verma', credits: '3', progress: 45, color: '#0ea5e9' },
    { name: 'Human Computer Interaction', code: 'CS403', venue: 'ROOM-C302', faculty: 'Dr. Priya Sharma', credits: '3', progress: 82, color: '#22c55e' },
    { name: 'Cloud Computing', code: 'CS404', venue: 'LAB-D201', faculty: 'Prof. Amit Singh', credits: '4', progress: 38, color: '#eab308' },
    { name: 'Cryptography', code: 'CS405', venue: 'ROOM-A201', faculty: 'Dr. Kevin Zhang', credits: '3', progress: 55, color: '#8b5cf6' },
    { name: 'Data Mining', code: 'CS406', venue: 'LAB-F301', faculty: 'Dr. David Park', credits: '3', progress: 62, color: '#ec4899' },
    { name: 'Mobile Application Development', code: 'CS407', venue: 'LAB-G102', faculty: 'Prof. Anna Martinez', credits: '3', progress: 75, color: '#f97316' },
    { name: 'Network Security', code: 'CS408', venue: 'ROOM-D102', faculty: 'Prof. James Miller', credits: '3', progress: 48, color: '#10b981' }
  ],
  s3: [
    { name: 'Theory of Computation', code: 'CS301T', venue: 'ROOM-A201', faculty: 'Dr. Nina Patel', credits: '3', progress: 72, color: '#6366f1' },
    { name: 'Computer Graphics', code: 'CS302G', venue: 'LAB-G201', faculty: 'Prof. Anna Martinez', credits: '3', progress: 68, color: '#ec4899' },
    { name: 'Embedded Systems', code: 'EC201', venue: 'LAB-EC02', faculty: 'Dr. Vikram Rao', credits: '3', progress: 61, color: '#f59e0b' },
    { name: 'Digital Signal Processing', code: 'EC202', venue: 'LAB-EC03', faculty: 'Dr. Anjali Desai', credits: '3', progress: 58, color: '#06b6d4' },
    { name: 'VLSI Design', code: 'EC203', venue: 'ROOM-EC01', faculty: 'Dr. Vikram Rao', credits: '3', progress: 65, color: '#14b8a6' },
    { name: 'Control Systems', code: 'EC204', venue: 'ROOM-EC02', faculty: 'Prof. Meera Iyer', credits: '3', progress: 70, color: '#84cc16' },
    { name: 'Microprocessors', code: 'EC205', venue: 'LAB-EC04', faculty: 'Dr. Vikram Rao', credits: '3', progress: 54, color: '#22c55e' },
    { name: 'Communication Engineering', code: 'EC206', venue: 'ROOM-EC03', faculty: 'Dr. Anjali Desai', credits: '3', progress: 66, color: '#0ea5e9' }
  ],
  s4: [
    { name: 'Discrete Mathematics', code: 'MA102', venue: 'ROOM-E101', faculty: 'Dr. Suresh Kumar', credits: '3', progress: 90, color: '#ef4444' },
    { name: 'Programming in C', code: 'CS101', venue: 'LAB-A001', faculty: 'Prof. Meera Iyer', credits: '4', progress: 95, color: '#d946ef' },
    { name: 'Digital Logic Design', code: 'EC101', venue: 'LAB-EC01', faculty: 'Dr. Vikram Rao', credits: '3', progress: 72, color: '#f97316' },
    { name: 'Engineering Physics', code: 'PH101', venue: 'ROOM-PH01', faculty: 'Dr. Anjali Desai', credits: '3', progress: 68, color: '#06b6d4' },
    { name: 'Engineering Chemistry', code: 'CH101', venue: 'ROOM-CH01', faculty: 'Dr. Anjali Desai', credits: '3', progress: 80, color: '#10b981' },
    { name: 'Engineering Mechanics', code: 'ME101', venue: 'ROOM-ME01', faculty: 'Prof. Suresh Kumar', credits: '3', progress: 74, color: '#f59e0b' },
    { name: 'Environmental Science', code: 'EV101', venue: 'ROOM-EV01', faculty: 'Dr. Priya Sharma', credits: '2', progress: 88, color: '#22c55e' },
    { name: 'Technical Communication', code: 'HS101', venue: 'ROOM-HS01', faculty: 'Prof. Meera Iyer', credits: '2', progress: 85, color: '#8b5cf6' }
  ],
  s5: [
    { name: 'Object Oriented Programming', code: 'CS201', venue: 'LAB-A002', faculty: 'Prof. Michael Ross', credits: '4', progress: 88, color: '#10b981' },
    { name: 'Data Structures Basics', code: 'CS202', venue: 'ROOM-A102', faculty: 'Dr. Sarah Chen', credits: '4', progress: 85, color: '#3b82f6' },
    { name: 'Numerical Methods', code: 'MA201', venue: 'ROOM-E201', faculty: 'Dr. Lisa Anderson', credits: '3', progress: 78, color: '#f59e0b' },
    { name: 'Basic Electronics', code: 'EC101', venue: 'LAB-EC01', faculty: 'Dr. Vikram Rao', credits: '3', progress: 72, color: '#06b6d4' },
    { name: 'Engineering Drawing', code: 'ME102', venue: 'ROOM-ME02', faculty: 'Prof. Suresh Kumar', credits: '2', progress: 82, color: '#ec4899' },
    { name: 'Probability & Statistics', code: 'MA202', venue: 'ROOM-E202', faculty: 'Dr. Jennifer White', credits: '3', progress: 75, color: '#14b8a6' },
    { name: 'Python Programming', code: 'CS203', venue: 'LAB-A003', faculty: 'Prof. Anna Martinez', credits: '3', progress: 90, color: '#22c55e' },
    { name: 'Economics for Engineers', code: 'HS102', venue: 'ROOM-HS02', faculty: 'Prof. Meera Iyer', credits: '2', progress: 80, color: '#84cc16' }
  ],
  s6: [
    { name: 'Engineering Chemistry', code: 'CH101', venue: 'ROOM-CH01', faculty: 'Dr. Anjali Desai', credits: '3', progress: 90, color: '#10b981' },
    { name: 'Communication Skills', code: 'HS101', venue: 'ROOM-HS01', faculty: 'Prof. Meera Iyer', credits: '2', progress: 88, color: '#06b6d4' },
    { name: 'Calculus', code: 'MA101', venue: 'ROOM-E101', faculty: 'Dr. Suresh Kumar', credits: '4', progress: 82, color: '#ef4444' },
    { name: 'Engineering Physics', code: 'PH101', venue: 'ROOM-PH01', faculty: 'Dr. Anjali Desai', credits: '3', progress: 76, color: '#0ea5e9' },
    { name: 'Problem Solving with C', code: 'CS100', venue: 'LAB-A001', faculty: 'Prof. Meera Iyer', credits: '3', progress: 88, color: '#3b82f6' },
    { name: 'Workshop Practice', code: 'ME100', venue: 'LAB-ME01', faculty: 'Prof. Suresh Kumar', credits: '2', progress: 92, color: '#f97316' },
    { name: 'Introduction to IT', code: 'CS100I', venue: 'ROOM-A001', faculty: 'Dr. Sarah Chen', credits: '2', progress: 85, color: '#a855f7' },
    { name: 'Professional Ethics', code: 'HS100', venue: 'ROOM-HS01', faculty: 'Prof. Meera Iyer', credits: '1', progress: 90, color: '#8b5cf6' }
  ]
}

function buildCourses() {
  const semesters = ['s1', 's2', 's3', 's4', 's5', 's6']
  const courses = []
  let id = 1
  semesters.forEach((semId) => {
    const list = SEMESTER_COURSES[semId]
    list.forEach((c) => {
      courses.push({
        id: String(id),
        name: c.name,
        semesterId: semId,
        properties: {
          'Course Code': c.code,
          Venue: c.venue,
          Faculty: c.faculty,
          Credits: c.credits,
          Section: 'A',
          Prerequisites: id > 1 ? 'Previous' : 'None',
          'Office Hours': 'Tue 2–4pm',
          ...courseDetailProps('Mon/Wed 9–10', '3 L', 'CSE', 'Textbook', 'https://lms.edu', 'https://lms.edu')
        },
        progress: c.progress,
        color: c.color
      })
      id++
    })
  })
  return courses
}

// 10 calendar events per semester (60 total)
function buildCalendarEvents() {
  const types = ['assignment', 'exam', 'quiz', 'presentation', 'personal', 'assignment', 'exam', 'quiz', 'presentation', 'personal']
  const events = []
  let eventId = 1
  const semesters = [
    { id: 's1', name: 'Fall 2025', courseStart: 1 },
    { id: 's2', name: 'Spring 2025', courseStart: 9 },
    { id: 's3', name: 'Winter 2024', courseStart: 17 },
    { id: 's4', name: 'Fall 2024', courseStart: 25 },
    { id: 's5', name: 'Spring 2024', courseStart: 33 },
    { id: 's6', name: 'Winter 2023', courseStart: 41 }
  ]
  const titles = [
    'Assignment Due', 'Mid-term Exam', 'Quiz', 'Project Presentation', 'Study Group',
    'Lab Submission', 'End-sem Exam', 'Class Test', 'Demo', 'Workshop'
  ]
  semesters.forEach((sem, semIdx) => {
    for (let i = 0; i < 10; i++) {
      const courseId = String(sem.courseStart + (i % 8))
      events.push({
        id: String(eventId),
        title: `${sem.name} - ${titles[i]}`,
        date: day(1 + semIdx * 14 + i * 2),
        time: i % 2 === 0 ? '10:00' : '14:00',
        type: types[i],
        courseId,
        semesterId: sem.id,
        description: `Event ${i + 1} for ${sem.name}`,
        properties: { Location: 'Room', Reminder: '1 day', 'Meeting Link': '' }
      })
      eventId++
    }
  })
  return events
}

// Timetable: each semester's 8 courses get slots across the week
function buildTimetable() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const slots = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
  let periodId = 1
  const semesters = [
    { semId: 's1', start: 1 },
    { semId: 's2', start: 9 },
    { semId: 's3', start: 17 },
    { semId: 's4', start: 25 },
    { semId: 's5', start: 33 },
    { semId: 's6', start: 41 }
  ]
  const times = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '16:00']
  semesters.forEach(({ start }) => {
    for (let d = 0; d < 6; d++) {
      const dayKey = days[d]
      const numSlots = d === 5 ? 2 : (d < 5 ? 4 : 0)
      for (let s = 0; s < numSlots; s++) {
        const courseIdx = (d * 2 + s) % 8
        slots[dayKey].push({
          period: periodId++,
          courseId: String(start + courseIdx),
          startTime: times[s],
          endTime: times[s + 1] || '17:00',
          venue: `ROOM-${dayKey}-${s}`
        })
      }
    }
  })
  // Fill with s1 (Fall 2025) as primary so Mon–Sat have content
  for (let d = 0; d < 6; d++) {
    const dayKey = days[d]
    if (slots[dayKey].length === 0) {
      for (let s = 0; s < 5; s++) {
        slots[dayKey].push({
          period: periodId++,
          courseId: String(1 + (s % 8)),
          startTime: times[s],
          endTime: times[s + 1],
          venue: `ROOM-A10${s}`
        })
      }
    }
  }
  return slots
}

// 10 notes per semester (60 total)
function buildMindSpaceItems() {
  const items = []
  let id = 1
  const semesters = ['s1', 's2', 's3', 's4', 's5', 's6']
  const titles = ['Review notes', 'Assignment prep', 'Lab summary', 'Exam revision', 'Project draft', 'Reading summary', 'Formula sheet', 'Practice problems', 'Concept map', 'Quick reference']
  const priorities = ['high', 'high', 'medium', 'high', 'medium', 'low', 'medium', 'high', 'low', 'medium']
  semesters.forEach((semId) => {
    for (let i = 0; i < 10; i++) {
      items.push({
        id: String(id),
        title: `Semester ${semId} - ${titles[i]}`,
        content: `Content for note ${i + 1} in this semester. Study material and tasks.`,
        type: 'text',
        completed: i % 4 === 0,
        priority: priorities[i],
        semesterId: semId,
        createdAt: now(),
        properties: { Tags: 'study', 'Due Date': 'Soon', 'Related Course': 'Course' }
      })
      id++
    }
  })
  return items
}

// 8 grades per semester (48 total) — one per course
function buildGrades() {
  const semesterNames = { s1: 'Fall 2025', s2: 'Spring 2025', s3: 'Winter 2024', s4: 'Fall 2024', s5: 'Spring 2024', s6: 'Winter 2023' }
  const grades = []
  const gradeLetters = ['S', 'A', 'A', 'B', 'B', 'B', 'C', 'A']
  let id = 1
  const semesters = ['s1', 's2', 's3', 's4', 's5', 's6']
  let courseId = 1
  semesters.forEach((semId) => {
    const semName = semesterNames[semId]
    for (let i = 0; i < 8; i++) {
      grades.push({
        id: String(id),
        courseId: String(courseId),
        grade: gradeLetters[i],
        credits: i % 2 === 0 ? '4' : '3',
        semester: semName,
        properties: { Remarks: 'OK', 'Grade Type': 'End-sem', Internal: '25/30', External: '60/70' }
      })
      id++
      courseId++
    }
  })
  return grades
}

// At least 1 file per course (48+ files)
function buildFiles() {
  const files = []
  const types = ['Lecture_Notes.pdf', 'Assignment.pdf', 'Slides.pdf', 'Lab_Manual.pdf', 'Reference.pdf', 'Solutions.pdf', 'Project.zip', 'Readings.pdf']
  for (let courseId = 1; courseId <= 48; courseId++) {
    const t = types[courseId % types.length]
    files.push({
      id: String(courseId),
      name: `Course_${courseId}_${t}`,
      courseId: String(courseId),
      fileName: `Course_${courseId}_${t}`,
      fileSize: 500000 + courseId * 10000,
      fileType: t.endsWith('.pdf') ? 'application/pdf' : t.endsWith('.zip') ? 'application/zip' : 'application/pdf',
      uploadedAt: now(),
      properties: { Category: 'Course', Notes: `For course ${courseId}`, Version: '1' }
    })
  }
  return files
}

// Build timetable properly: each day has slots for courses 1-8 (s1), 9-16 (s2), etc.
function buildTimetableCorrect() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const slots = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
  let periodId = 1
  const times = [['08:00', '09:30'], ['10:00', '11:30'], ['12:00', '13:00'], ['14:00', '15:30'], ['16:00', '17:00']]
  // For each semester (8 courses), add slots across Mon–Sat so when filtered we see a full week
  const semesters = [
    { start: 1, venue: 'ROOM-A' },
    { start: 9, venue: 'ROOM-B' },
    { start: 17, venue: 'ROOM-C' },
    { start: 25, venue: 'ROOM-D' },
    { start: 33, venue: 'ROOM-E' },
    { start: 41, venue: 'ROOM-F' }
  ]
  semesters.forEach(({ start, venue }) => {
    for (let d = 0; d < 6; d++) {
      const dayKey = days[d]
      const n = d === 5 ? 2 : 4
      for (let s = 0; s < n; s++) {
        const [startTime, endTime] = times[s]
        const courseIdx = (d + s) % 8
        slots[dayKey].push({
          period: periodId++,
          courseId: String(start + courseIdx),
          startTime,
          endTime,
          venue: `${venue}${101 + courseIdx}`
        })
      }
    }
  })
  return slots
}

export const defaultCourses = buildCourses()
export const defaultCalendarEvents = buildCalendarEvents()
export const defaultTimetable = buildTimetableCorrect()
export const defaultMindSpaceItems = buildMindSpaceItems()
export const defaultGrades = buildGrades()
export const defaultFiles = buildFiles()

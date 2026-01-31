import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

const DataContext = createContext()
const getApiUrl = () => import.meta.env.VITE_API_URL || ''
const DEMO_EMAIL = 'demo@university.edu'

const emptyTimetable = {
  monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}

// Comprehensive placeholder data
const defaultCourses = [
  {
    id: '1',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    venue: 'ROOM-A101',
    faculty: 'Dr. Sarah Chen',
    classNumber: 'CH101',
    credits: '4',
    description: 'Advanced data structures including trees, graphs, and algorithm analysis',
    progress: 78,
    color: '#3b82f6'
  },
  {
    id: '2',
    courseCode: 'CS302',
    courseName: 'Database Management Systems',
    venue: 'LAB-B205',
    faculty: 'Prof. Michael Ross',
    classNumber: 'CH102',
    credits: '3',
    description: 'Relational databases, SQL, and NoSQL systems',
    progress: 65,
    color: '#a855f7'
  },
  {
    id: '3',
    courseCode: 'CS303',
    courseName: 'Operating Systems',
    venue: 'ROOM-C301',
    faculty: 'Dr. Emily Wang',
    classNumber: 'CH103',
    credits: '4',
    description: 'Process management, memory systems, and file systems',
    progress: 52,
    color: '#06b6d4'
  },
  {
    id: '4',
    courseCode: 'CS304',
    courseName: 'Computer Networks',
    venue: 'LAB-D102',
    faculty: 'Prof. James Miller',
    classNumber: 'CH104',
    credits: '3',
    description: 'Network protocols, architecture, and security fundamentals',
    progress: 41,
    color: '#10b981'
  },
  {
    id: '5',
    courseCode: 'MA201',
    courseName: 'Linear Algebra',
    venue: 'ROOM-E201',
    faculty: 'Dr. Lisa Anderson',
    classNumber: 'CH105',
    credits: '3',
    description: 'Vector spaces, matrices, and linear transformations',
    progress: 88,
    color: '#f59e0b'
  },
  {
    id: '6',
    courseCode: 'CS305',
    courseName: 'Machine Learning',
    venue: 'LAB-F301',
    faculty: 'Dr. David Park',
    classNumber: 'CH106',
    credits: '4',
    description: 'Supervised and unsupervised learning algorithms',
    progress: 35,
    color: '#ec4899'
  },
  {
    id: '7',
    courseCode: 'CS306',
    courseName: 'Web Development',
    venue: 'LAB-G102',
    faculty: 'Prof. Anna Martinez',
    classNumber: 'CH107',
    credits: '3',
    description: 'Full-stack development with modern frameworks',
    progress: 92,
    color: '#f97316'
  },
  {
    id: '8',
    courseCode: 'CS307',
    courseName: 'Software Engineering',
    venue: 'ROOM-H201',
    faculty: 'Dr. Robert Kim',
    classNumber: 'CH108',
    credits: '3',
    description: 'Software development lifecycle and best practices',
    progress: 70,
    color: '#84cc16'
  },
  {
    id: '9',
    courseCode: 'MA202',
    courseName: 'Probability & Statistics',
    venue: 'ROOM-E202',
    faculty: 'Dr. Jennifer White',
    classNumber: 'CH109',
    credits: '3',
    description: 'Statistical methods and probability theory',
    progress: 55,
    color: '#14b8a6'
  },
  {
    id: '10',
    courseCode: 'CS308',
    courseName: 'Artificial Intelligence',
    venue: 'LAB-F302',
    faculty: 'Prof. Kevin Zhang',
    classNumber: 'CH110',
    credits: '4',
    description: 'AI fundamentals, search algorithms, and neural networks',
    progress: 28,
    color: '#8b5cf6'
  }
]

const defaultTimetable = {
  monday: [
    { period: 1, courseId: '1', startTime: '08:00', endTime: '09:30', venue: 'ROOM-A101' },
    { period: 2, courseId: '3', startTime: '10:00', endTime: '11:30', venue: 'ROOM-C301' },
    { period: 3, courseId: '5', startTime: '12:00', endTime: '13:00', venue: 'ROOM-E201' },
    { period: 4, courseId: '7', startTime: '14:00', endTime: '15:30', venue: 'LAB-G102' },
    { period: 5, courseId: '9', startTime: '16:00', endTime: '17:00', venue: 'ROOM-E202' }
  ],
  tuesday: [
    { period: 1, courseId: '2', startTime: '08:00', endTime: '09:30', venue: 'LAB-B205' },
    { period: 2, courseId: '4', startTime: '10:00', endTime: '11:30', venue: 'LAB-D102' },
    { period: 3, courseId: '6', startTime: '12:00', endTime: '13:30', venue: 'LAB-F301' },
    { period: 4, courseId: '8', startTime: '14:00', endTime: '15:30', venue: 'ROOM-H201' },
    { period: 5, courseId: '10', startTime: '16:00', endTime: '17:30', venue: 'LAB-F302' }
  ],
  wednesday: [
    { period: 1, courseId: '1', startTime: '08:00', endTime: '09:30', venue: 'ROOM-A101' },
    { period: 2, courseId: '5', startTime: '10:00', endTime: '11:00', venue: 'ROOM-E201' },
    { period: 3, courseId: '3', startTime: '11:30', endTime: '13:00', venue: 'ROOM-C301' },
    { period: 4, courseId: '7', startTime: '14:00', endTime: '15:30', venue: 'LAB-G102' },
    { period: 5, courseId: '9', startTime: '16:00', endTime: '17:00', venue: 'ROOM-E202' }
  ],
  thursday: [
    { period: 1, courseId: '2', startTime: '08:00', endTime: '09:30', venue: 'LAB-B205' },
    { period: 2, courseId: '6', startTime: '10:00', endTime: '11:30', venue: 'LAB-F301' },
    { period: 3, courseId: '4', startTime: '12:00', endTime: '13:30', venue: 'LAB-D102' },
    { period: 4, courseId: '8', startTime: '14:00', endTime: '15:30', venue: 'ROOM-H201' },
    { period: 5, courseId: '10', startTime: '16:00', endTime: '17:30', venue: 'LAB-F302' }
  ],
  friday: [
    { period: 1, courseId: '1', startTime: '08:00', endTime: '09:30', venue: 'ROOM-A101' },
    { period: 2, courseId: '3', startTime: '10:00', endTime: '11:30', venue: 'ROOM-C301' },
    { period: 3, courseId: '5', startTime: '12:00', endTime: '13:00', venue: 'ROOM-E201' },
    { period: 4, courseId: '6', startTime: '14:00', endTime: '15:30', venue: 'LAB-F301' }
  ],
  saturday: [
    { period: 1, courseId: '7', startTime: '09:00', endTime: '10:30', venue: 'LAB-G102' },
    { period: 2, courseId: '10', startTime: '11:00', endTime: '12:30', venue: 'LAB-F302' }
  ],
  sunday: []
}

const defaultCalendarEvents = [
  {
    id: '1',
    title: 'DSA Assignment #4 Due',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '23:59',
    type: 'assignment',
    courseId: '1',
    description: 'Submit linked list and tree implementation'
  },
  {
    id: '2',
    title: 'DBMS Mid-term Exam',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:00',
    type: 'exam',
    courseId: '2',
    description: 'Chapters 1-5, SQL queries, Normalization'
  },
  {
    id: '3',
    title: 'ML Project Presentation',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:00',
    type: 'presentation',
    courseId: '6',
    description: 'Final project demo - Image Classification'
  },
  {
    id: '4',
    title: 'OS Lab Report Submission',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '17:00',
    type: 'assignment',
    courseId: '3',
    description: 'Process scheduling simulation report'
  },
  {
    id: '5',
    title: 'Linear Algebra Quiz #3',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '11:00',
    type: 'quiz',
    courseId: '5',
    description: 'Eigenvalues and Eigenvectors'
  },
  {
    id: '6',
    title: 'Networks Lab Practical',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:00',
    type: 'exam',
    courseId: '4',
    description: 'TCP/IP configuration and troubleshooting'
  },
  {
    id: '7',
    title: 'Web Dev Project Demo',
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '15:00',
    type: 'presentation',
    courseId: '7',
    description: 'E-commerce website demonstration'
  },
  {
    id: '8',
    title: 'Software Engineering Sprint Review',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:00',
    type: 'presentation',
    courseId: '8',
    description: 'Sprint 3 deliverables review'
  },
  {
    id: '9',
    title: 'Probability Assignment Due',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '23:59',
    type: 'assignment',
    courseId: '9',
    description: 'Bayes theorem problems'
  },
  {
    id: '10',
    title: 'AI Mini Project Submission',
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '18:00',
    type: 'assignment',
    courseId: '10',
    description: 'Search algorithm implementation'
  },
  {
    id: '11',
    title: 'Study Group - DSA',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '19:00',
    type: 'personal',
    description: 'Group study session for graphs'
  },
  {
    id: '12',
    title: 'Career Fair',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:00',
    type: 'personal',
    description: 'Campus placement drive'
  }
]

const defaultMindSpaceItems = [
  {
    id: '1',
    title: 'Review Binary Search Trees',
    content: 'Cover AVL trees, Red-Black trees, and B-trees for the upcoming DSA exam. Focus on balancing operations.',
    type: 'text',
    completed: false,
    priority: 'high',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'SQL Practice Questions',
    content: 'Complete 20 complex join queries from the practice set. Focus on subqueries and aggregate functions.',
    type: 'text',
    completed: false,
    priority: 'high',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'OS Concepts Summary',
    content: 'Make notes on deadlock prevention, memory management, and page replacement algorithms.',
    type: 'text',
    completed: true,
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Network Protocols Cheat Sheet',
    content: 'TCP/IP, UDP, HTTP, HTTPS, FTP - create a quick reference guide with port numbers.',
    type: 'text',
    completed: false,
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'ML Model Comparison',
    content: 'Compare accuracy of different classifiers (SVM, Random Forest, Neural Network) on the dataset.',
    type: 'text',
    completed: true,
    priority: 'high',
    createdAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'React Component Patterns',
    content: 'Study HOCs, Render Props, Custom Hooks, and Context API patterns for the web dev project.',
    type: 'text',
    completed: false,
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: '7',
    title: 'Git Workflow Documentation',
    content: 'Document the branching strategy and PR review process for the team project.',
    type: 'text',
    completed: true,
    priority: 'low',
    createdAt: new Date().toISOString()
  },
  {
    id: '8',
    title: 'Linear Algebra Formulas',
    content: 'Compile all important formulas for determinants, matrix operations, and vector spaces.',
    type: 'text',
    completed: false,
    priority: 'high',
    createdAt: new Date().toISOString()
  },
  {
    id: '9',
    title: 'Research Paper Reading',
    content: 'Read "Attention Is All You Need" paper for AI course presentation.',
    type: 'text',
    completed: false,
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: '10',
    title: 'Docker Setup Guide',
    content: 'Create a step-by-step guide for containerizing the web application.',
    type: 'text',
    completed: true,
    priority: 'low',
    createdAt: new Date().toISOString()
  },
  {
    id: '11',
    title: 'Probability Distributions',
    content: 'Review Normal, Binomial, Poisson distributions with examples.',
    type: 'text',
    completed: false,
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: '12',
    title: 'API Design Best Practices',
    content: 'Study RESTful API design principles and implement in the project.',
    type: 'text',
    completed: false,
    priority: 'low',
    createdAt: new Date().toISOString()
  }
]

const defaultGrades = [
  { id: '1', courseId: '1', grade: 'S', credits: '4', semester: 'Fall 2025' },
  { id: '2', courseId: '2', grade: 'A', credits: '3', semester: 'Fall 2025' },
  { id: '3', courseId: '5', grade: 'B', credits: '3', semester: 'Fall 2025' },
  { id: '4', courseId: '7', grade: 'S', credits: '3', semester: 'Fall 2025' },
  { id: '5', courseId: '3', grade: 'A', credits: '4', semester: 'Winter 2025' },
  { id: '6', courseId: '4', grade: 'B', credits: '3', semester: 'Winter 2025' },
  { id: '7', courseId: '8', grade: 'A', credits: '3', semester: 'Winter 2025' },
  { id: '8', courseId: '9', grade: 'B', credits: '3', semester: 'Winter 2025' },
  { id: '9', courseId: '6', grade: 'S', credits: '4', semester: 'Fall 2024' },
  { id: '10', courseId: '10', grade: 'A', credits: '4', semester: 'Fall 2024' },
  { id: '11', courseId: '1', grade: 'A', credits: '4', semester: 'Fall 2024' },
  { id: '12', courseId: '2', grade: 'S', credits: '3', semester: 'Winter 2024' },
  { id: '13', courseId: '5', grade: 'A', credits: '3', semester: 'Winter 2024' },
  { id: '14', courseId: '3', grade: 'B', credits: '4', semester: 'Winter 2024' }
]

const defaultFiles = [
  {
    id: '1',
    name: 'DSA_Lecture_Notes_Week1-4.pdf',
    courseId: '1',
    fileName: 'DSA_Lecture_Notes_Week1-4.pdf',
    fileSize: 2457600,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'DSA_Assignment_Solutions.pdf',
    courseId: '1',
    fileName: 'DSA_Assignment_Solutions.pdf',
    fileSize: 1536000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'SQL_Complete_Cheatsheet.pdf',
    courseId: '2',
    fileName: 'SQL_Complete_Cheatsheet.pdf',
    fileSize: 1024000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'DBMS_ER_Diagrams.png',
    courseId: '2',
    fileName: 'DBMS_ER_Diagrams.png',
    fileSize: 819200,
    fileType: 'image/png',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'OS_Lab_Manual_Complete.pdf',
    courseId: '3',
    fileName: 'OS_Lab_Manual_Complete.pdf',
    fileSize: 5120000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Process_Scheduling_Simulation.zip',
    courseId: '3',
    fileName: 'Process_Scheduling_Simulation.zip',
    fileSize: 3072000,
    fileType: 'application/zip',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Network_Topology_Diagrams.png',
    courseId: '4',
    fileName: 'Network_Topology_Diagrams.png',
    fileSize: 1228800,
    fileType: 'image/png',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '8',
    name: 'TCP_IP_Protocol_Stack.pdf',
    courseId: '4',
    fileName: 'TCP_IP_Protocol_Stack.pdf',
    fileSize: 2048000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Linear_Algebra_Formula_Sheet.pdf',
    courseId: '5',
    fileName: 'Linear_Algebra_Formula_Sheet.pdf',
    fileSize: 512000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '10',
    name: 'ML_Project_Dataset.csv',
    courseId: '6',
    fileName: 'ML_Project_Dataset.csv',
    fileSize: 4096000,
    fileType: 'text/csv',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '11',
    name: 'ML_Model_Notebook.ipynb',
    courseId: '6',
    fileName: 'ML_Model_Notebook.ipynb',
    fileSize: 1843200,
    fileType: 'application/json',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '12',
    name: 'React_Project_Boilerplate.zip',
    courseId: '7',
    fileName: 'React_Project_Boilerplate.zip',
    fileSize: 2560000,
    fileType: 'application/zip',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '13',
    name: 'API_Documentation.pdf',
    courseId: '7',
    fileName: 'API_Documentation.pdf',
    fileSize: 1024000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '14',
    name: 'Software_Requirements_Spec.docx',
    courseId: '8',
    fileName: 'Software_Requirements_Spec.docx',
    fileSize: 768000,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '15',
    name: 'Probability_Solved_Examples.pdf',
    courseId: '9',
    fileName: 'Probability_Solved_Examples.pdf',
    fileSize: 1536000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '16',
    name: 'AI_Search_Algorithms.pptx',
    courseId: '10',
    fileName: 'AI_Search_Algorithms.pptx',
    fileSize: 3584000,
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '17',
    name: 'Resume_2025.pdf',
    courseId: null,
    fileName: 'Resume_2025.pdf',
    fileSize: 256000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  },
  {
    id: '18',
    name: 'Internship_Offer_Letter.pdf',
    courseId: null,
    fileName: 'Internship_Offer_Letter.pdf',
    fileSize: 384000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  }
]

function getDataKey(user) {
  if (!user) return null
  return user.email?.toLowerCase() === DEMO_EMAIL ? 'demo' : user.id
}

const SAVE_DEBOUNCE_MS = 800

export const DataProvider = ({ children }) => {
  const { user } = useAuth()
  const dataKey = getDataKey(user)
  const skipSaveRef = useRef(false)
  const saveTimeoutRef = useRef(null)

  const [courses, setCourses] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [mindSpaceItems, setMindSpaceItems] = useState([])
  const [timetable, setTimetable] = useState(emptyTimetable)
  const [files, setFiles] = useState([])
  const [grades, setGrades] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  // Load data from backend when user (dataKey) changes
  useEffect(() => {
    if (!dataKey) {
      setCourses([])
      setCalendarEvents([])
      setMindSpaceItems([])
      setTimetable(emptyTimetable)
      setFiles([])
      setGrades([])
      setDataLoading(false)
      return
    }
    let cancelled = false
    setDataLoading(true)
    fetch(`${getApiUrl()}/api/data`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data) => {
        if (cancelled) return
        const isDemo = dataKey === 'demo'
        const isEmpty = !data.courses?.length && !data.calendarEvents?.length && !data.mindSpaceItems?.length
        if (isDemo && isEmpty) {
          setCourses(defaultCourses)
          setCalendarEvents(defaultCalendarEvents)
          setMindSpaceItems(defaultMindSpaceItems)
          setTimetable(defaultTimetable)
          setFiles(defaultFiles)
          setGrades(defaultGrades)
          skipSaveRef.current = true
          fetch(`${getApiUrl()}/api/data`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courses: defaultCourses,
              calendarEvents: defaultCalendarEvents,
              mindSpaceItems: defaultMindSpaceItems,
              timetable: defaultTimetable,
              files: defaultFiles,
              grades: defaultGrades
            })
          }).catch(() => {})
        } else {
          setCourses(data.courses ?? [])
          setCalendarEvents(data.calendarEvents ?? [])
          setMindSpaceItems(data.mindSpaceItems ?? [])
          setTimetable(data.timetable && Object.keys(data.timetable).length ? data.timetable : emptyTimetable)
          setFiles(data.files ?? [])
          setGrades(data.grades ?? [])
          skipSaveRef.current = true
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCourses([])
          setCalendarEvents([])
          setMindSpaceItems([])
          setTimetable(emptyTimetable)
          setFiles([])
          setGrades([])
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })
    return () => { cancelled = true }
  }, [dataKey])

  // Debounced save to backend when data changes
  useEffect(() => {
    if (!dataKey) return
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null
      fetch(`${getApiUrl()}/api/data`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses,
          calendarEvents,
          mindSpaceItems,
          timetable,
          files,
          grades
        })
      }).catch(() => {})
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [dataKey, courses, calendarEvents, mindSpaceItems, timetable, files, grades])

  const addCourse = (course) => {
    const newCourse = {
      id: Date.now().toString(),
      ...course,
      progress: 0,
      color: ['#3b82f6', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 6)],
      createdAt: new Date().toISOString()
    }
    setCourses([...courses, newCourse])
    return newCourse
  }

  const updateCourse = (id, updates) => {
    setCourses(courses.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id))
    setTimetable(prev => {
      const newTimetable = { ...prev }
      Object.keys(newTimetable).forEach(day => {
        newTimetable[day] = newTimetable[day].filter(period => period.courseId !== id)
      })
      return newTimetable
    })
    setCalendarEvents(prev => prev.filter(e => e.courseId !== id))
  }

  const addCalendarEvent = (event) => {
    const newEvent = {
      id: Date.now().toString(),
      ...event,
      createdAt: new Date().toISOString()
    }
    setCalendarEvents([...calendarEvents, newEvent])
    return newEvent
  }

  const updateCalendarEvent = (id, updates) => {
    setCalendarEvents(calendarEvents.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  const deleteCalendarEvent = (id) => {
    setCalendarEvents(calendarEvents.filter(e => e.id !== id))
  }

  const addMindSpaceItem = (item) => {
    const newItem = {
      id: Date.now().toString(),
      ...item,
      createdAt: new Date().toISOString(),
      completed: false
    }
    setMindSpaceItems([...mindSpaceItems, newItem])
    return newItem
  }

  const updateMindSpaceItem = (id, updates) => {
    setMindSpaceItems(mindSpaceItems.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const deleteMindSpaceItem = (id) => {
    setMindSpaceItems(mindSpaceItems.filter(i => i.id !== id))
  }

  const updateTimetable = (day, periods) => {
    setTimetable({ ...timetable, [day]: periods })
  }

  const addFile = (file) => {
    const newFile = {
      id: Date.now().toString(),
      ...file,
      uploadedAt: new Date().toISOString()
    }
    setFiles([...files, newFile])
    return newFile
  }

  const deleteFile = (id) => {
    setFiles(files.filter(f => f.id !== id))
  }

  const addGrade = (grade) => {
    const newGrade = {
      id: Date.now().toString(),
      ...grade
    }
    setGrades([...grades, newGrade])
    return newGrade
  }

  const updateGrade = (id, updates) => {
    setGrades(grades.map(g => g.id === id ? { ...g, ...updates } : g))
  }

  const deleteGrade = (id) => {
    setGrades(grades.filter(g => g.id !== id))
  }

  const getCourseById = (id) => {
    return courses.find(c => c.id === id)
  }

  // Reset current user's data to defaults (demo = placeholder, others = empty) and save to backend
  const resetToDefaults = () => {
    if (!dataKey) return
    const isDemo = dataKey === 'demo'
    const newCourses = isDemo ? defaultCourses : []
    const newEvents = isDemo ? defaultCalendarEvents : []
    const newMind = isDemo ? defaultMindSpaceItems : []
    const newTimetable = isDemo ? defaultTimetable : emptyTimetable
    const newFiles = isDemo ? defaultFiles : []
    const newGrades = isDemo ? defaultGrades : []
    setCourses(newCourses)
    setCalendarEvents(newEvents)
    setMindSpaceItems(newMind)
    setTimetable(newTimetable)
    setFiles(newFiles)
    setGrades(newGrades)
    skipSaveRef.current = true
    fetch(`${getApiUrl()}/api/data`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courses: newCourses,
        calendarEvents: newEvents,
        mindSpaceItems: newMind,
        timetable: newTimetable,
        files: newFiles,
        grades: newGrades
      })
    }).catch(() => {})
  }

  const value = {
    courses,
    calendarEvents,
    mindSpaceItems,
    timetable,
    files,
    grades,
    dataLoading,
    addCourse,
    updateCourse,
    deleteCourse,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    addMindSpaceItem,
    updateMindSpaceItem,
    deleteMindSpaceItem,
    updateTimetable,
    addFile,
    deleteFile,
    addGrade,
    updateGrade,
    deleteGrade,
    getCourseById,
    resetToDefaults
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
